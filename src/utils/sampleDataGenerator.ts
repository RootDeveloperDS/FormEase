/**
 * Generates high-resolution sample documents entirely in-browser using HTML5 Canvas.
 * Provides immediate instant demo testing for hackathon judges and new users.
 */

export async function generateSamplePhotoBlob(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d')!;

  // 1. Studio Backdrop (Off-white / pale neutral gradient)
  const bgGrad = ctx.createRadialGradient(600, 500, 100, 600, 600, 800);
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 1200);

  // 2. Torso / Professional Suit & Collar
  ctx.fillStyle = '#1e293b'; // Navy Suit
  ctx.beginPath();
  ctx.moveTo(250, 1200);
  ctx.bezierCurveTo(300, 950, 450, 880, 600, 880);
  ctx.bezierCurveTo(750, 880, 900, 950, 950, 1200);
  ctx.closePath();
  ctx.fill();

  // White shirt collar
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(520, 880);
  ctx.lineTo(600, 980);
  ctx.lineTo(680, 880);
  ctx.lineTo(600, 930);
  ctx.closePath();
  ctx.fill();

  // Neck
  ctx.fillStyle = '#e8b898';
  ctx.beginPath();
  ctx.moveTo(530, 850);
  ctx.lineTo(530, 720);
  ctx.lineTo(670, 720);
  ctx.lineTo(670, 850);
  ctx.closePath();
  ctx.fill();

  // 3. Head & Facial Geometry
  ctx.fillStyle = '#f5cbb0'; // Skin tone
  ctx.beginPath();
  ctx.ellipse(600, 560, 220, 290, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#261b17';
  ctx.beginPath();
  ctx.ellipse(600, 410, 240, 210, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(390, 490, 45, 120, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(810, 490, 45, 120, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows
  ctx.strokeStyle = '#33231e';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(460, 500);
  ctx.quadraticCurveTo(510, 485, 550, 500);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(650, 500);
  ctx.quadraticCurveTo(690, 485, 740, 500);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(505, 535, 32, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(695, 535, 32, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Irises
  ctx.fillStyle = '#374151';
  ctx.beginPath();
  ctx.arc(505, 535, 16, 0, Math.PI * 2);
  ctx.arc(695, 535, 16, 0, Math.PI * 2);
  ctx.fill();

  // Pupils & Highlights
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(505, 535, 8, 0, Math.PI * 2);
  ctx.arc(695, 535, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(501, 531, 4, 0, Math.PI * 2);
  ctx.arc(691, 531, 4, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.strokeStyle = '#d69e7b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(600, 530);
  ctx.lineTo(595, 615);
  ctx.quadraticCurveTo(600, 630, 618, 625);
  ctx.stroke();

  // Lips
  ctx.fillStyle = '#d47572';
  ctx.beginPath();
  ctx.ellipse(600, 690, 50, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], 'raw_camera_passport_photo.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.95);
  });
}

export async function generateSampleSignatureBlob(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 500;
  const ctx = canvas.getContext('2d')!;

  // Off-white yellowish paper with realistic desk lighting gradient
  const paperGrad = ctx.createLinearGradient(0, 0, 1000, 500);
  paperGrad.addColorStop(0, '#fefbf3');
  paperGrad.addColorStop(0.5, '#f5efe0');
  paperGrad.addColorStop(1, '#ece3ce');
  ctx.fillStyle = paperGrad;
  ctx.fillRect(0, 0, 1000, 500);

  // Slight paper grain / shadow bar at corner
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  ctx.fillRect(0, 420, 1000, 80);

  // Blue ballpoint ink signature
  ctx.strokeStyle = '#1d3557';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(150, 290);
  ctx.bezierCurveTo(190, 160, 240, 140, 280, 230);
  ctx.bezierCurveTo(310, 310, 340, 340, 390, 210);
  ctx.bezierCurveTo(420, 130, 480, 150, 450, 280);
  ctx.bezierCurveTo(430, 330, 490, 310, 540, 240);
  ctx.bezierCurveTo(580, 180, 640, 190, 670, 260);
  ctx.bezierCurveTo(700, 320, 750, 230, 820, 200);
  ctx.stroke();

  // Underline flourish
  ctx.beginPath();
  ctx.moveTo(220, 360);
  ctx.quadraticCurveTo(520, 385, 840, 320);
  ctx.stroke();

  // Two decorative dots
  ctx.fillStyle = '#1d3557';
  ctx.beginPath();
  ctx.arc(800, 390, 8, 0, Math.PI * 2);
  ctx.arc(840, 385, 8, 0, Math.PI * 2);
  ctx.fill();

  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], 'raw_phone_signature_scan.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.95);
  });
}

export async function generateSampleCertificateBlob(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754; // A4 portrait ratio
  const ctx = canvas.getContext('2d')!;

  // Certificate Parchment Background
  ctx.fillStyle = '#fdfdfb';
  ctx.fillRect(0, 0, 1240, 1754);

  // Ornate double border
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 12;
  ctx.strokeRect(60, 60, 1120, 1634);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(84, 84, 1072, 1586);

  // Authority Header
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('NATIONAL ACCREDITATION BOARD', 620, 240);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 24px sans-serif';
  ctx.fillText('GOVERNMENT OF INDIA • VERIFIED IDENTITY RECORD', 620, 290);

  // Decorative Rule
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(320, 330);
  ctx.lineTo(920, 330);
  ctx.stroke();

  // Document Title
  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 52px serif';
  ctx.fillText('CERTIFICATE OF VERIFICATION', 620, 440);

  // Main Body Text
  ctx.fillStyle = '#334155';
  ctx.font = '400 28px sans-serif';
  ctx.fillText('This is to certify that the applicant named herein:', 620, 560);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 46px sans-serif';
  ctx.fillText('ALEXANDER K. CHATTERJEE', 620, 670);

  ctx.fillStyle = '#475569';
  ctx.font = '400 24px sans-serif';
  ctx.fillText('Roll No: 2026-UPSC-984210  •  DOB: 14-Aug-1998', 620, 740);
  ctx.fillText('Has successfully completed all biometric and educational criteria', 620, 830);
  ctx.fillText('for official application submission with distinction.', 620, 875);

  // Gold / Red Official Seal
  ctx.save();
  ctx.translate(620, 1180);
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 105, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('OFFICIAL SEAL', 0, -10);
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('GOVT • 2026', 0, 25);
  ctx.restore();

  // Signatures at bottom
  ctx.fillStyle = '#1e293b';
  ctx.font = 'italic 32px serif';
  ctx.fillText('Dr. M. K. Narayanan', 320, 1480);
  ctx.fillText('Sec. R. V. Swaminathan', 920, 1480);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 1500);
  ctx.lineTo(440, 1500);
  ctx.moveTo(800, 1500);
  ctx.lineTo(1040, 1500);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '500 20px sans-serif';
  ctx.fillText('Controller of Examinations', 320, 1540);
  ctx.fillText('Member Secretary', 920, 1540);

  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], 'raw_marksheet_certificate_scan.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.95);
  });
}

export async function generateDemoDossierFiles(): Promise<{
  photo: File;
  signature: File;
  document: File;
}> {
  const [photo, signature, document] = await Promise.all([
    generateSamplePhotoBlob(),
    generateSampleSignatureBlob(),
    generateSampleCertificateBlob(),
  ]);

  return { photo, signature, document };
}
