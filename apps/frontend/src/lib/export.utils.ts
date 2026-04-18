/**
 * Standardized Export Utilities for SmartBiz AI.
 * 
 * Note: Client-side PDF generation (html-to-image/jspdf) has been removed to reduce bundle size 
 * and improve reliability. Exports are now primarily handled via the Backend Report Engine.
 */

export const exportToPDF = async (elementId: string, filename: string = 'dashboard-export.pdf') => {
  console.log(`Deprecated: Attempted client-side export of ${elementId} as ${filename}.`);
  
  // Provide user feedback that they should use the official reports
  alert("L'exportation directe du tableau de bord est temporairement désactivée pour maintenance. Veuillez utiliser l'onglet 'Rapports' pour générer un document PDF professionnel complet via notre moteur IA.");
  
  return false;
};
