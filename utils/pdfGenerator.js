const PDFDocument = require('pdfkit');
const { format } = require('date-fns');

// Générer un PDF en mémoire
async function createPdfContract(motoAd, user, startDate, endDate, totalAmount) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    let buffers = [];

    // Stocker le PDF en mémoire
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Titre
    doc.fontSize(20).text('Contrat de location de moto', { align: 'center' });
    doc.moveDown();

    // Détails du locataire
    doc.fontSize(14).text(`Nom du locataire : ${user.name}`);
    doc.text(`E-mail du locataire : ${user.email}`);
    doc.moveDown();

    // Détails de la moto
    doc.fontSize(16).text(`Moto louée : ${motoAd.title}`, { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`Prix par jour : ${motoAd.pricePerDay}€`);
    doc.text(`Caution : ${motoAd.deposit || 100}€`);
    doc.text(`Période de location : du ${format(new Date(startDate), 'dd/MM/yyyy')} au ${format(new Date(endDate), 'dd/MM/yyyy')}`);
    doc.moveDown();

    // Ajouter le prix final
    doc.fontSize(14).text(`Prix total payé : ${totalAmount.toFixed(2)}€`);
    doc.moveDown();

    // Signature
    doc.text('Signature du locataire :                                Signature du propriétaire : ');

    doc.end();
  });
}

module.exports = { createPdfContract };
