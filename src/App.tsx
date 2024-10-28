/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import emailjs from '@emailjs/browser';

const PUBLIC_KEY = "ZEbu82HJPmDxaR-ig";
const SERVICE_ID = 'service_lwr2od9';
const TEMPLATE_ID = 'template_vl9913g';

const SPREADSHEET_ID = '1PPBF_pl3-r7PmUVpTzFE0kJ7YRO9yGkC0p05M6TF3hk';
const SHEET_NAME = 'Sayfa1';
const API_KEY = 'AIzaSyCKe5ftPXtLeXD_kgH5Eg37yQ9rOP7ZEHI';

const App = () => {
  const [emailTemplate, setEmailTemplate] = useState('');
  const [status, setStatus] = useState('');
  const [processing, setProcessing] = useState(false);
  const [emailList, setEmailList] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      emailjs.init(PUBLIC_KEY);
    } catch (err) {
      console.error('EmailJS initialization error:', err);
      setError('EmailJS başlatılamadı!');
    }
  }, []);

  const fetchEmails = async () => {
    try {
      setError(null);
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:A?key=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.values) {
        throw new Error('Google Sheets\'ten veri alınamadı');
      }

      const emails = data.values
        .slice(1)
        .map((row: any[]) => row[0]?.trim())
        .filter((email: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return email && emailRegex.test(email);
        });

      setEmailList(emails);
      setStatus(`${emails.length} adet geçerli mail adresi yüklendi.`);
    } catch (error: any) {
      const errorMessage = `Mail listesi yüklenirken hata: ${error.message}`;
      setError(errorMessage);
      console.error('Fetch error:', error);
      setEmailList([]);
    }
  };

  useEffect(() => {
    if (SPREADSHEET_ID && API_KEY) {
      fetchEmails();
      
      const interval = autoRefresh ? setInterval(fetchEmails, 5 * 60 * 1000) : null;
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      setError('Google Sheets yapılandırması eksik!');
    }
  }, [autoRefresh]);

  const sendEmail = async (email: string): Promise<boolean> => {
    try {
      const templateParams = {
        to_email: email,
        message: emailTemplate,
        from_name: "Code Merkezi Yazılım ve Teknoloji", 
        subject: "Yazılım Çözümlerimizle İşinizi Geliştirin",
        to_name: "",
        recipient: "",
        email: "",
        bcc: "",
        cc: ""
      };

      const response = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        templateParams
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      return response.status === 200;
    } catch (error) {
      console.error(`${email} adresine mail gönderilirken hata:`, error);
      return false;
    }
  };

  const sendEmails = async () => {
    if (!emailTemplate.trim()) {
      setError('Lütfen bir mail şablonu girin!');
      return;
    }

    if (emailList.length === 0) {
      setError('Mail listesi boş!');
      return;
    }

    setProcessing(true);
    setError(null);
    setStatus(`${emailList.length} adet mail gönderilmeye başlanıyor...`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < emailList.length; i++) {
      const email = emailList[i];
      setStatus(`${email} adresine mail gönderiliyor... (${i + 1}/${emailList.length})`);
      
      const success = await sendEmail(email);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setStatus(`İşlem tamamlandı! ${successCount} mail başarıyla gönderildi, ${failCount} mail gönderilemedi.`);
    setProcessing(false);
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header as="h5" className="bg-primary text-white">
              Toplu Mail Gönderici
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}
              
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h6>Google Sheets Mail Listesi</h6>
                  <div>
                    <Form.Check
                      type="switch"
                      id="auto-refresh"
                      label="Otomatik Güncelle"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="me-2 d-inline-block"
                    />
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={fetchEmails}
                      disabled={processing}
                    >
                      Listeyi Güncelle
                    </Button>
                  </div>
                </div>
                {emailList.length > 0 && (
                  <small className="text-muted">
                    Yüklenen mail sayısı: {emailList.length}
                  </small>
                )}
              </div>

              <Form.Group className="mb-4">
                <Form.Label>Mail İçeriği</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  placeholder="Mail içeriğini buraya yazın..."
                  disabled={processing}
                />
              </Form.Group>

              <Button
                variant="success"
                onClick={sendEmails}
                disabled={processing || emailList.length === 0}
                className="mb-4"
              >
                {processing ? 'Gönderiliyor...' : 'Mailleri Gönder'}
              </Button>

              {status && (
                <Alert variant="info" className="mb-3">
                  {status}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;