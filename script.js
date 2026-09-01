const form = document.getElementById('documentForm');

const setText = (id, value) => {
  const el = document.getElementById(id);
  if (el) el.textContent = (value || '').trim();
};

const sampleBill = {
  consignment: '8384001075283', serial: '1.', depdate: '2083-04-29', deptime: '10:02:32',
  vehicle: '00000', person: 'N.k footwear', mobile: '9822040432', departure: 'Malangwa', destination: 'SIRAHA',
  doctype: 'बिल', custompoint: '-', docno: '46', docdate: '2083-04-29', goods: 'SHOES', package: 'पोका',
  qty: '2.00', amount: '15,326.40', span: '300480597', supplier: 'सोनी सु स्टोर्स', bpan: '605466863',
  buyer: 'एन. के. फुटवेयर', remarks: 'Golbazar', topname: 'सोनी सु स्टोर्स', topplace: 'Malangwa',
  toppan: '300480597', vcts: '9812108558'
};

const populateForm = values => {
  Object.entries(values).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.value = value;
    setText(input.dataset.output, value);
  });
  setText('v_destination2', values.destination || '');
};

form.querySelectorAll('[data-output]').forEach(input =>
  input.addEventListener('input', () => {
    setText(input.dataset.output, input.value);
    if (input.id === 'destination') setText('v_destination2', input.value);
  })
);

// Show defaults (such as "बिल") in the preview immediately, while leaving every field editable.
form.querySelectorAll('[data-output]').forEach(input => {
  if (input.value) setText(input.dataset.output, input.value);
});

form.addEventListener('reset', () => setTimeout(() => {
  form.querySelectorAll('[data-output]').forEach(input => setText(input.dataset.output, ''));
  setText('v_destination2', '');
  const logo = document.getElementById('v_logo');
  logo.removeAttribute('src');
  logo.style.display = 'none';
}, 0));

document.getElementById('autoFillButton').addEventListener('click', () => {
  populateForm(sampleBill);
  document.getElementById('pdfStatus').textContent = 'Sample bill data filled. You can edit it before downloading.';
});

document.getElementById('logoUpload').addEventListener('change', event => {
  const file = event.target.files[0];
  const logo = document.getElementById('v_logo');
  if (!file) { logo.removeAttribute('src'); logo.style.display = 'none'; return; }
  const reader = new FileReader();
  reader.onload = () => { logo.src = reader.result; logo.style.display = 'block'; };
  reader.readAsDataURL(file);
});

const printDocument = () => window.print();

/* ---- Direct single-page PDF download, same page size as original (864 x 1296 pt) ---- */
const PAGE_W = 864, PAGE_H = 1296;

const downloadPdf = async () => {
  const button = document.getElementById('printButton');
  const status = document.getElementById('pdfStatus');
  button.disabled = true;
  status.textContent = 'Preparing PDF tools...';
  try {
    await (window.pdfToolsReady || Promise.resolve());
  } catch (error) {
    console.error(error);
  }
  if (!window.html2canvas || !window.jspdf) {
    status.textContent = 'PDF tools could not load. Please check your internet connection and try again.';
    button.disabled = false;
    return;
  }
  status.textContent = 'Preparing your one-page PDF...';
  try {
    await document.fonts.ready;
    const page = document.getElementById('document');
    const canvas = await html2canvas(page, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: Math.max(document.documentElement.clientWidth, 900),
      onclone: doc => {
        const el = doc.getElementById('document');
        el.style.transform = 'none';   // undo mobile preview scaling so capture is full-size
        el.style.margin = '0';
      }
    });
    const image = canvas.toDataURL('image/jpeg', 0.97);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PAGE_W, PAGE_H], compress: true });
    pdf.addImage(image, 'JPEG', 0, 0, PAGE_W, PAGE_H, undefined, 'FAST');
    const cid = document.getElementById('consignment').value.trim();
    pdf.save(`consignment-${cid || new Date().toISOString().slice(0, 10)}.pdf`);
    status.textContent = 'PDF downloaded successfully.';
  } catch (error) {
    console.error(error);
    status.textContent = 'Could not create the PDF. Please retry.';
  } finally {
    button.disabled = false;
  }
};

document.getElementById('printButton').addEventListener('click', downloadPdf);
document.getElementById('mobilePrint').addEventListener('click', downloadPdf);
document.getElementById('printPage').addEventListener('click', printDocument);
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
    event.preventDefault();
    printDocument();
  }
});
