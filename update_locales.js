const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'apps/frontend/src/i18n/locales');
const files = ['fr.json', 'en.json', 'ar.json'];

files.forEach(file => {
  const filePath = path.join(localesPath, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Dashboard / Sidebar
  data.dashboard = data.dashboard || {};
  data.dashboard.tabs = data.dashboard.tabs || {};
  
  if (file === 'fr.json') {
    data.sidebar.dashboard = "Tableau de Bord";
    data.sidebar.team = "Équipe";
    data.sidebar.valuation = "Valorisation";
    data.sidebar.reports = "Rapports";
    data.sidebar.settings = "Paramètres";
    data.sidebar.systemState = "État du Système";
    data.sidebar.telemetry = "Télémétrie OP";

    data.dashboard.tabs.strategic = "Vue Stratégique";
    data.dashboard.tabs.financial = "Perf. Financière";
    data.dashboard.tabs.operational = "Vue Opérationnelle";
    data.dashboard.tabs.mlProjection = "Prédictions IA";

    data.team.tabs = { members: "Membres", inbox: "Boîte de réception" };
    
    data.valuation.methods = {
      evEbitda: "EV / EBITDA",
      evRevenue: "EV / Revenue",
      peRatio: "P/E Ratio",
      assetBased: "Asset-Based",
      gordonGrowth: "Gordon Growth"
    };

    data.reports.tabs = {
      newReport: "Nouveau Rapport",
      myReports: "Mes Rapports"
    };

    data.settings.tabs = {
      company: "Entreprise",
      account: "Mon compte",
      team: "Équipe",
      preferences: "Préférences"
    };

    data.topbar = data.topbar || {};
    data.topbar.roleOwner = "Super Administrateur";
    data.topbar.roleAdmin = "Administrateur";
    data.topbar.roleUser = "Utilisateur";
    data.topbar.online = "En Ligne";
    data.topbar.activeSession = "Session Active";
    data.topbar.secureSpace = "Espace Sécurisé";
    
    data.team.transferOwnership = "Transférer la propriété";
    data.team.inbox = {
      title: "Boîte de réception (Demandes d'accès)",
      subtitle: "Gérez les demandes d'invitation provenant de la landing page.",
      search: "Rechercher...",
      date: "Date",
      user: "Utilisateur",
      companyRole: "Entreprise / Rôle",
      message: "Message",
      status: "Statut",
      actions: "Actions",
      empty: "Aucune demande trouvée."
    };
    
    data.settings.company = data.settings.company || {};
    data.settings.company.heading = "Profil de l'entreprise";
    data.settings.company.name = "Nom de l'entreprise";
    data.settings.company.registrationNumber = "Numéro d'immatriculation";
    data.settings.company.sector = "Secteur d'activité";
    data.settings.company.currency = "Devise";
    data.settings.company.fiscalYearStart = "Mois de début d'exercice";
    data.settings.company.country = "Pays";
    data.settings.company.countryPlaceholder = "Ex: Tunisie";

    data.team.roleLabels = {
      owner: "Super Admin",
      admin: "Admin",
      collab: "Collaborateur",
      reader: "Lecteur"
    };
  } else if (file === 'en.json') {
    data.sidebar.dashboard = "Dashboard";
    data.sidebar.team = "Team";
    data.sidebar.valuation = "Valuation";
    data.sidebar.reports = "Reports";
    data.sidebar.settings = "Settings";
    data.sidebar.systemState = "System State";
    data.sidebar.telemetry = "Telemetry OP";

    data.dashboard.tabs.strategic = "Strategic View";
    data.dashboard.tabs.financial = "Financial Perf.";
    data.dashboard.tabs.operational = "Operational View";
    data.dashboard.tabs.mlProjection = "AI Predictions";

    data.team.tabs = { members: "Members", inbox: "Inbox" };
    
    data.valuation.methods = {
      evEbitda: "EV / EBITDA",
      evRevenue: "EV / Revenue",
      peRatio: "P/E Ratio",
      assetBased: "Asset-Based",
      gordonGrowth: "Gordon Growth"
    };

    data.reports.tabs = {
      newReport: "New Report",
      myReports: "My Reports"
    };

    data.settings.tabs = {
      company: "Company",
      account: "My Account",
      team: "Team",
      preferences: "Preferences"
    };

    data.topbar = data.topbar || {};
    data.topbar.roleOwner = "Super Administrator";
    data.topbar.roleAdmin = "Administrator";
    data.topbar.roleUser = "User";
    data.topbar.online = "Online";
    data.topbar.activeSession = "Active Session";
    data.topbar.secureSpace = "Secure Space";
    
    data.team.transferOwnership = "Transfer Ownership";
    data.team.inbox = {
      title: "Inbox (Access Requests)",
      subtitle: "Manage invitation requests from the landing page.",
      search: "Search...",
      date: "Date",
      user: "User",
      companyRole: "Company / Role",
      message: "Message",
      status: "Status",
      actions: "Actions",
      empty: "No requests found."
    };
    
    data.settings.company = data.settings.company || {};
    data.settings.company.heading = "Company Profile";
    data.settings.company.name = "Company Name";
    data.settings.company.registrationNumber = "Registration Number";
    data.settings.company.sector = "Sector of Activity";
    data.settings.company.currency = "Currency";
    data.settings.company.fiscalYearStart = "Fiscal Year Start Month";
    data.settings.company.country = "Country";
    data.settings.company.countryPlaceholder = "Ex: Tunisia";

    data.team.roleLabels = {
      owner: "Super Admin",
      admin: "Admin",
      collab: "Collaborator",
      reader: "Reader"
    };
  } else if (file === 'ar.json') {
    data.sidebar.dashboard = "لوحة القيادة";
    data.sidebar.team = "فريق العمل";
    data.sidebar.valuation = "التقييم";
    data.sidebar.reports = "التقارير";
    data.sidebar.settings = "الإعدادات";
    data.sidebar.systemState = "حالة النظام";
    data.sidebar.telemetry = "القياس عن بعد";

    data.dashboard.tabs.strategic = "الرؤية الاستراتيجية";
    data.dashboard.tabs.financial = "الأداء المالي";
    data.dashboard.tabs.operational = "التحليل التشغيلي";
    data.dashboard.tabs.mlProjection = "التوقع الذكي";

    data.team.tabs = { members: "الأعضاء", inbox: "صندوق الوارد" };
    
    data.valuation.methods = {
      evEbitda: "EV / EBITDA",
      evRevenue: "EV / Revenue",
      peRatio: "P/E Ratio",
      assetBased: "Asset-Based",
      gordonGrowth: "Gordon Growth"
    };

    data.reports.tabs = {
      newReport: "تقرير جديد",
      myReports: "تقاريري"
    };

    data.settings.tabs = {
      company: "الشركة",
      account: "حسابي",
      team: "الفريق",
      preferences: "التفضيلات"
    };

    data.topbar = data.topbar || {};
    data.topbar.roleOwner = "المدير العام";
    data.topbar.roleAdmin = "المسؤول";
    data.topbar.roleUser = "المستخدم";
    data.topbar.online = "متصل";
    data.topbar.activeSession = "الجلسة النشطة";
    data.topbar.secureSpace = "مساحة آمنة";
    
    data.team.transferOwnership = "نقل الملكية";
    data.team.inbox = {
      title: "صندوق الوارد (طلبات الوصول)",
      subtitle: "إدارة طلبات الدعوة من الصفحة الرئيسية.",
      search: "بحث...",
      date: "التاريخ",
      user: "المستخدم",
      companyRole: "الشركة / الدور",
      message: "الرسالة",
      status: "الحالة",
      actions: "الإجراءات",
      empty: "لم يتم العثور على طلبات."
    };
    
    data.settings.company = data.settings.company || {};
    data.settings.company.heading = "ملف الشركة";
    data.settings.company.name = "اسم الشركة";
    data.settings.company.registrationNumber = "رقم السجل التجاري";
    data.settings.company.sector = "قطاع النشاط";
    data.settings.company.currency = "العملة";
    data.settings.company.fiscalYearStart = "شهر بداية السنة المالية";
    data.settings.company.country = "البلد";
    data.settings.company.countryPlaceholder = "مثال: تونس";

    data.team.roleLabels = {
      owner: "المدير العام",
      admin: "مسؤول",
      collab: "متعاون",
      reader: "قارئ"
    };
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
});
