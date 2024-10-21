/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, ProgressBar } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import emailjs from '@emailjs/browser';

emailjs.init("aIWawUe0dF3GmbZZS");

interface EmailSenderState {
  selectedFile: File | null;
  emailList: string[];
  emailTemplate: string;
  isRunning: boolean;
  currentIndex: number;
  status: string;
  alertVariant: 'info' | 'success' | 'warning' | 'danger';
}

const App = () => {
  const [state, setState] = useState<EmailSenderState>({
    selectedFile: null,
    emailList: [],
    emailTemplate: '',
    isRunning: false,
    currentIndex: 0,
    status: '',
    alertVariant: 'info'
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const emailList = jsonData
          .slice(1)
          .map((row: any) => row[0])
          .filter((email: string) => email && email.includes('@'));

        console.log('Okunan email listesi:', emailList);

        setState(prev => ({
          ...prev,
          selectedFile: file,
          emailList,
          status: `${emailList.length} adet email adresi yüklendi.`,
          alertVariant: 'success'
        }));
      } catch (error) {
        console.error('Excel okuma hatası:', error);
        setState(prev => ({
          ...prev,
          status: 'Excel dosyası okunurken hata oluştu!',
          alertVariant: 'danger'
        }));
      }
    }
  };

  const sendEmail = async (toEmail: string, template: string) => {
    try {
      const templateParams = {
        to_name: toEmail.split('@')[0], 
        to_email: toEmail,
        message: template,
        from_name: 'Mail Gönderici',
        reply_to: 'sinannovatech@gmail.com'
      };

      console.log('Mail gönderiliyor:', templateParams);

      const response = await emailjs.send(
        'service_e3ug5rd',
        'template_eez56ls',
        templateParams
      );

      if (response.status !== 200) {
        throw new Error(`Email gönderimi başarısız: ${response.text}`);
      }

      console.log('Mail gönderim cevabı:', response);
      return true;
    } catch (error) {
      console.error('Mail gönderme hatası:', error);
      return false;
    }
  };

  const startSending = () => {
    if (state.emailTemplate.trim() === '') {
      setState(prev => ({
        ...prev,
        status: 'Lütfen bir mail şablonu girin!',
        alertVariant: 'warning'
      }));
      return;
    }
    if (state.emailList.length === 0) {
      setState(prev => ({
        ...prev,
        status: 'Lütfen önce bir Excel dosyası seçin!',
        alertVariant: 'warning'
      }));
      return;
    }
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentIndex: 0,
      alertVariant: 'info',
      status: 'Mail gönderimi başlıyor...'
    }));
  };

  const stopSending = () => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      status: 'Mail gönderimi durduruldu.',
      alertVariant: 'warning'
    }));
  };

  const getProgress = () => {
    if (state.emailList.length === 0) return 0;
    return Math.round((state.currentIndex / state.emailList.length) * 100);
  };

  useEffect(() => {
    let interval = null;

    if (state.isRunning && state.currentIndex < state.emailList.length) {
      interval = setInterval(async () => {
        const currentEmail = state.emailList[state.currentIndex];
        
        setState(prev => ({
          ...prev,
          status: `${currentEmail} adresine mail gönderiliyor... (${state.currentIndex + 1}/${state.emailList.length})`,
          alertVariant: 'info'
        }));

        try {
          const success = await sendEmail(currentEmail, state.emailTemplate);
          
          if (success) {
            setState(prev => ({
              ...prev,
              status: `${currentEmail} adresine mail başarıyla gönderildi!`,
              currentIndex: prev.currentIndex + 1,
              alertVariant: 'success'
            }));
          } else {
            throw new Error('Mail gönderilemedi');
          }
        } catch (error) {
          console.error('Mail gönderme hatası:', error);
          setState(prev => ({
            ...prev,
            status: `${currentEmail} adresine mail gönderilirken hata oluştu!`,
            isRunning: false,
            alertVariant: 'danger'
          }));
        }
      }, 2000);
    } else if (state.currentIndex >= state.emailList.length && state.isRunning) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        status: 'Tüm mailler başarıyla gönderildi!',
        alertVariant: 'success'
      }));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning, state.currentIndex, state.emailList, state.emailTemplate]);

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header as="h5" className="bg-primary text-white">
              <i className="bi bi-envelope-fill me-2"></i>
              Otomatik Mail Gönderici
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-4">
                <Form.Label>Excel Dosyası Seç</Form.Label>
                <div className="d-flex align-items-center gap-2">
                  <Button 
                    variant="outline-primary"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <i className="bi bi-upload me-2"></i>
                    Dosya Seç
                  </Button>
                  <Form.Control
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    className="d-none"
                    onChange={handleFileSelect}
                  />
                  {state.selectedFile && (
                    <span className="text-muted">
                      {state.selectedFile.name} ({state.emailList.length} email)
                    </span>
                  )}
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Mail Şablonu</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={state.emailTemplate}
                  onChange={(e) => setState(prev => ({...prev, emailTemplate: e.target.value}))}
                  placeholder="Mail içeriğini buraya yazın..."
                />
              </Form.Group>

              <div className="d-flex gap-2 mb-4">
                <Button
                  variant="success"
                  onClick={startSending}
                  disabled={state.isRunning || state.emailList.length === 0}
                >
                  <i className="bi bi-play-fill me-2"></i>
                  Göndermeye Başla
                </Button>
                <Button
                  variant="danger"
                  onClick={stopSending}
                  disabled={!state.isRunning}
                >
                  <i className="bi bi-stop-fill me-2"></i>
                  Durdur
                </Button>
              </div>

              {state.status && (
                <Alert variant={state.alertVariant} className="mb-3">
                  {state.status}
                </Alert>
              )}

              {state.isRunning && (
                <div>
                  <ProgressBar 
                    animated 
                    now={getProgress()} 
                    label={`${getProgress()}%`}
                    className="mb-2"
                  />
                  <small className="text-muted">
                    İşlenen: {state.currentIndex} / {state.emailList.length}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;