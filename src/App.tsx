import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, ProgressBar } from 'react-bootstrap';

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [emailList, setEmailList] = useState([]);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('');
  const [alertVariant, setAlertVariant] = useState('info');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    
    setEmailList(['test1@mail.com', 'test2@mail.com', 'test3@mail.com']);
    setStatus('Excel dosyası yüklendi. Mail listesi hazır.');
    setAlertVariant('success');
  };

  useEffect(() => {
    let interval;
    if (isRunning && currentIndex < emailList.length) {
      interval = setInterval(() => {
        console.log(`Mail gönderiliyor: ${emailList[currentIndex]}`);
        setStatus(`${emailList[currentIndex]} adresine mail gönderiliyor...`);
        setCurrentIndex(prev => prev + 1);
      }, 2000);
    } else if (currentIndex >= emailList.length && isRunning) {
      setIsRunning(false);
      setStatus('Tüm mailler gönderildi!');
      setAlertVariant('success');
    }

    return () => clearInterval(interval);
  }, [isRunning, currentIndex, emailList]);

  const startSending = () => {
    if (emailTemplate.trim() === '') {
      setStatus('Lütfen bir mail şablonu girin!');
      setAlertVariant('warning');
      return;
    }
    if (emailList.length === 0) {
      setStatus('Lütfen önce bir Excel dosyası seçin!');
      setAlertVariant('warning');
      return;
    }
    setIsRunning(true);
    setCurrentIndex(0);
    setAlertVariant('info');
  };

  const stopSending = () => {
    setIsRunning(false);
    setStatus('Mail gönderimi durduruldu.');
    setAlertVariant('warning');
  };

  const getProgress = () => {
    return (currentIndex / emailList.length) * 100;
  };

  return (
    <>
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
                    onClick={() => document.getElementById('file-upload').click()}
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
                  {selectedFile && (
                    <span className="text-muted">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Mail Şablonu</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  placeholder="Mail içeriğini buraya yazın..."
                />
              </Form.Group>

              <div className="d-flex gap-2 mb-4">
                <Button
                  variant="success"
                  onClick={startSending}
                  disabled={isRunning}
                >
                  <i className="bi bi-play-fill me-2"></i>
                  Göndermeye Başla
                </Button>
                <Button
                  variant="danger"
                  onClick={stopSending}
                  disabled={!isRunning}
                >
                  <i className="bi bi-stop-fill me-2"></i>
                  Durdur
                </Button>
              </div>

              {status && (
                <Alert variant={alertVariant} className="mb-3">
                  {status}
                </Alert>
              )}

              {isRunning && (
                <div>
                  <ProgressBar 
                    animated 
                    now={getProgress()} 
                    label={`${Math.round(getProgress())}%`}
                    className="mb-2"
                  />
                  <small className="text-muted">
                    İşlenen: {currentIndex} / {emailList.length}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </>
  )
}

export default App