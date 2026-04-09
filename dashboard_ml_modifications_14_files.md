# Dashboard + ML Prediction - Document complet des 14 fichiers modifies

Date: 2026-04-03
Perimetre: Amelioration Dashboard pro, integration Prediction ML, gestion des etats d erreur/pending, i18n FR/EN/AR.

## 1) Liste des 14 fichiers couverts

1. apps/frontend/src/pages/Dashboard.tsx
2. apps/frontend/src/components/dashboard/DashboardTopbar.tsx
3. apps/frontend/src/components/dashboard/PredictionCenter.tsx
4. apps/frontend/src/components/dashboard/CashFlowComposedChart.tsx
5. apps/frontend/src/components/dashboard/CustomerGrowthChart.tsx
6. apps/frontend/src/components/dashboard/PayrollDonutChart.tsx
7. apps/frontend/src/components/dashboard/AnnualFundamentals.tsx
8. apps/frontend/src/lib/financial.service.ts
9. apps/frontend/src/types/dashboard.ts
10. apps/frontend/src/index.css
11. apps/frontend/src/i18n/locales/en.json
12. apps/frontend/src/i18n/locales/fr.json
13. apps/frontend/src/i18n/locales/ar.json
14. apps/backend/src/prediction/prediction.service.ts

---

## 2) Resume executif

- Le dashboard a ete restructure en 3 vues: executive, operational, prediction.
- Le flux Prediction ML a ete relie a l UI via run + latest.
- Les graphiques metiers ont ete enrichis pour un rendu plus professionnel.
- Les etats ML non-completes (FAILED, PENDING, PROCESSING) sont maintenant visibles et comprehensibles dans le frontend.
- Les textes i18n ont ete etendus dans les 3 langues (EN, FR, AR).

Impact principal:
- Meilleure lisibilite pour utilisateur non technique.
- Moins d erreurs silencieuses (on voit pourquoi la prediction ne remonte pas).
- Navigation plus claire avec URL tab state.

---

## 3) Details par fichier

### 3.1 apps/frontend/src/pages/Dashboard.tsx

Objectif:
- Orchestrer toute la page dashboard: chargement des metrics, prediction, historique imports, tabs URL.

Modifications cle:
- Ajout de la logique d onglets via query param tab (executive/operational/prediction).
- Ajout des fetchs:
  - getDashboardMetrics/getDashboardMetricsByBatchId
  - getPrediction
  - getImportHistory
- Ajout de l action handleRunPrediction:
  - POST /prediction/run
  - puis GET /prediction/latest
  - bascule auto sur onglet prediction
- Correctif robustesse:
  - si runPrediction retourne status FAILED, la vraie erreur backend est affichee.

Impact:
- UX plus fluide et navigation persistante.
- Moins de confusion quand la prediction echoue (message explicite).

---

### 3.2 apps/frontend/src/components/dashboard/DashboardTopbar.tsx

Objectif:
- Barre superieure unifiee: salutation, actions, tabs.

Modifications cle:
- Boutons:
  - Historique import (avec badge count)
  - Import
  - Run AI Prediction (loading spinner)
- Tabs 3 vues avec icones.
- Suppression de la selection de version/batch dans le topbar (demande produit).

Impact:
- Topbar plus propre, orientee action.
- Parcours utilisateur simplifie.

---

### 3.3 apps/frontend/src/components/dashboard/PredictionCenter.tsx

Objectif:
- Presenter les resultats ML de facon business-friendly.

Modifications cle:
- Etat vide intelligent:
  - no data
  - pending/processing
  - failed + message erreur backend
- Chart projection:
  - ligne continue revenue
  - bornes min/max en pointille
- Cards de valorisation Y+1/Y+2/Y+3.
- Feature influence (bar chart) simplifie et lisible.
- Retrait de la logique MAE visible pour utilisateur non technique.

Impact:
- Lecture plus intuitive pour utilisateurs non data.
- Diagnostic plus rapide en cas d echec prediction.

---

### 3.4 apps/frontend/src/components/dashboard/CashFlowComposedChart.tsx

Objectif:
- Vue executive cash flow avec comparaison revenus/depenses + trend cash.

Modifications cle:
- Ajout ComposedChart:
  - Bar Gross_Revenue
  - Bar Operating_Expenses_Total
  - Line Ending_Cash_Balance
  - ReferenceLine a 0
- Tooltip/legend propres et formatage nombres.

Impact:
- Lecture immediate de l equilibre operationnel et tresorerie.

---

### 3.5 apps/frontend/src/components/dashboard/CustomerGrowthChart.tsx

Objectif:
- Vue operational sur acquisition/churn et depense marketing.

Modifications cle:
- ComposedChart:
  - Bar New_Customers_Acquired
  - Bar Customers_Churned
  - Line Marketing_Spend
- Fallback no data standard.

Impact:
- Meilleure visibilite CAC/churn dynamique.

---

### 3.6 apps/frontend/src/components/dashboard/PayrollDonutChart.tsx

Objectif:
- Visualiser la structure des couts operationnels.

Modifications cle:
- Donut chart sur dernier point:
  - Payroll_Expenses
  - Other Operating Expenses
- Calcul payroll share (%).
- Bloc recap chiffres payroll/other.

Impact:
- Comprendre vite la pression salariale.

---

### 3.7 apps/frontend/src/components/dashboard/AnnualFundamentals.tsx

Objectif:
- Afficher les fondamentaux annuels importes et la variation annuelle.

Modifications cle:
- Tableau de metriques:
  - Assets, Liabilities, Revenues, OperatingIncome, OperatingCashFlow
- Calcul delta YoY quand possible.
- Codes couleur positif/negatif.

Impact:
- Donne un contexte financier structurel autour des KPIs.

---

### 3.8 apps/frontend/src/lib/financial.service.ts

Objectif:
- Service unique des appels API frontend.

Modifications cle:
- Ajout des endpoints prediction:
  - getPrediction() -> GET /prediction/latest
  - runPrediction() -> POST /prediction/run
- Conserve import/template/history existants.

Impact:
- Couche API centralisee et reutilisable.

---

### 3.9 apps/frontend/src/types/dashboard.ts

Objectif:
- Typage central dashboard + prediction.

Modifications cle:
- Definition PredictionResult/PredictionRunResult plus complete.
- Ajout champs status et error dans PredictionResult.
- Ajout types GrowthPrediction, FinancialValuation, MacroFeatures.
- Definition DashboardTab (executive/operational/prediction).

Impact:
- Type safety meilleure.
- UI peut rendre correctement les etats FAILED/PENDING/PROCESSING.

---

### 3.10 apps/frontend/src/index.css

Objectif:
- Uniformiser le style dashboard et composants reutilisables.

Modifications cle:
- Ajout utilitaires visuels:
  - action-btn
  - badge-count
  - bento-card
  - chart-title
  - status-badge (healthy/warning/critical)
  - progress-bar-track / progress-bar-fill
- Renforcement style system (cards, animations, helper classes).

Impact:
- Aspect plus professionnel et coherent.
- Base reutilisable pour futures pages.

Note:
- Un warning CSS d ordre des @import peut apparaitre au build; non bloquant.

---

### 3.11 apps/frontend/src/i18n/locales/en.json

Objectif:
- Couvrir les nouveaux labels dashboard/prediction en anglais.

Modifications cle:
- Ajout tabs labels.
- Ajout mlZone:
  - runPrediction/running
  - noData/noDataHint
  - failedTitle/failedHint
  - pendingTitle/pendingHint
  - revenueProjection/featureImportance/projectionRangeHint

Impact:
- UI complete en EN pour toutes les nouvelles zones.

---

### 3.12 apps/frontend/src/i18n/locales/fr.json

Objectif:
- Couvrir les nouveaux labels dashboard/prediction en francais.

Modifications cle:
- Meme structure fonctionnelle que EN.
- Corrections de chaines accentuees pour etats failed/pending.

Impact:
- Cohesion linguistique FR sur tout le flux prediction.

---

### 3.13 apps/frontend/src/i18n/locales/ar.json

Objectif:
- Couvrir les nouveaux labels dashboard/prediction en arabe.

Modifications cle:
- Meme structure fonctionnelle que EN/FR.
- Ajout des messages failed/pending/noData/revenueProjection/featureImportance.

Impact:
- Experience multilingue complete et coherente.

---

### 3.14 apps/backend/src/prediction/prediction.service.ts

Objectif:
- Orchestrer prediction ML cote backend (NestJS).

Modifications cle:
- runPrediction(companyId):
  - Cree record prediction PENDING -> PROCESSING
  - Recupere dernier ImportBatch
  - Map macroFeatures vers payload FastAPI
  - Appel ML engine /predict avec X-API-Key
  - Sauvegarde COMPLETED avec result
  - En cas erreur: status FAILED + result.error
- getLatestPrediction(companyId):
  - Renvoie d abord dernier COMPLETED (comportement principal)
  - Sinon renvoie dernier etat (FAILED/PENDING/PROCESSING) avec error

Impact:
- Plus de transparence pour le frontend.
- Le frontend peut differencier:
  - pas de prediction
  - prediction en cours
  - prediction echouee + cause.

---

## 4) Flux fonctionnel final

1. Utilisateur clique Run AI Prediction (DashboardTopbar).
2. Frontend appelle POST /prediction/run.
3. Backend cree prediction, map les donnees financieres, appelle ML engine.
4. Backend sauvegarde result COMPLETED ou FAILED.
5. Frontend appelle GET /prediction/latest.
6. Onglet Prediction affiche:
   - chart + cards si COMPLETED
   - message pending si PROCESSING/PENDING
   - message failed + detail erreur si FAILED

---

## 5) Validation effectuee

- Build frontend: OK
- Build backend: OK
- Verification types sur fichiers modifies: OK

---

## 6) Risques residuels et recommandations

Risques:
- Si ML engine est down, l etat FAILED remonte bien, mais aucune donnee de projection n est visible (normal).
- Si les donnees importees sont incompletes, prediction peut echouer (message d erreur visible).

Recommandations:
1. Ajouter un health check UI pour ML engine (status up/down).
2. Logger cote backend avec code erreur structure (ex: ML_TIMEOUT, ML_SCHEMA_ERROR).
3. Ajouter un polling auto court (2-3 essais) apres runPrediction pour eviter refresh manuel.
4. Documenter officiellement les champs macroFeatures requis pour prediction.

---

## 7) Conclusion

Le lot des 14 fichiers apporte une version dashboard beaucoup plus professionnelle, une meilleure lisibilite metier des projections ML, et surtout une chaine de diagnostic claire quand la prediction n apparait pas dans le frontend.

---

## 8) Methode recommandee pour afficher les donnees ML dans le Dashboard

Objectif:
- Donner une lecture business claire de la prediction ML.
- Montrer la fiabilite de la prediction (intervalles de confiance).
- Montrer pourquoi le modele predit cette valeur (explicabilite).
- Permettre a l utilisateur de tester des hypotheses de valorisation.

### 8.1 Ce que le dashboard doit afficher

1. Serie historique (base de donnee):
- Afficher par defaut les 2 annees precedentes (N-2, N-1) si disponibles.
- Si une seule annee historique existe, afficher N-1 uniquement.
- Si aucune annee historique, afficher un etat vide guide utilisateur.

2. Serie de prediction (ML):
- Apres clic sur Run AI Prediction, afficher 3 annees projetees (Y+1, Y+2, Y+3).
- Afficher en ligne principale la projection Realiste.
- Afficher les bornes Optimiste (best case) et Pessimiste (worst case).

3. Bande de confiance:
- Ajouter une zone ombree entre pessimiste et optimiste autour de la courbe realiste.
- Cette zone represente la marge d erreur / incertitude.

4. Explicabilite:
- Ajouter un chart de facteurs influents (SHAP values ou feature importance).
- Montrer les top facteurs positifs et negatifs (ex: Top 5 / Top 5).

5. Valorisation configurable:
- Permettre a l utilisateur de modifier certains parametres de valorisation (sans re-entrainer le modele):
  - EV multiple
  - liability margin
  - cash margin
- Recalculer instantanement Enterprise Value et Equity Value selon ces parametres.

### 8.2 Chart principal conseille

Nom du chart:
- Enterprise Value Scenario Chart

Structure visuelle:
- Axe X: N-2, N-1, Y+1, Y+2, Y+3
- Axe Y: valeur entreprise (EV) ou revenue projete
- Courbe 1 (solid): Realiste
- Courbe 2 (dashed): Optimiste
- Courbe 3 (dashed): Pessimiste
- Area band: zone entre pessimiste et optimiste
- Marker visuel sur la transition entre historique et projection

Legende claire:
- Historique
- Projection realiste
- Scenario optimiste
- Scenario pessimiste
- Intervalle de confiance

### 8.3 Comment calculer les scenarios (simple et robuste)

Notation:
- g1, g2, g3 = CAGR predits par le modele pour Y+1, Y+2, Y+3
- sigma1, sigma2, sigma3 = incertitude associee a chaque horizon

Scenario realiste:
- utiliser directement g1, g2, g3

Scenario optimiste:
- g_opt_h = g_h + k * sigma_h

Scenario pessimiste:
- g_pes_h = g_h - k * sigma_h

Avec:
- k = 1.0 (intervalle standard) ou 1.28 / 1.64 selon niveau de confiance souhaite

Projection revenue:
- Rev_Y1 = Rev_0 * (1 + g1)
- Rev_Y2 = Rev_Y1 * (1 + g2)
- Rev_Y3 = Rev_Y2 * (1 + g3)

Puis valorisation:
- EV_t = Rev_t * multiple
- Equity_t = EV_t - (Rev_t * liability_margin) + (Rev_t * cash_margin)

Meme logique pour realiste/optimiste/pessimiste avec leurs g respectifs.

### 8.4 D ou vient sigma (marge d erreur)

Option A (recommandee court terme, rapide):
- Utiliser erreur de validation historique du modele (MAE ou RMSE) par horizon Y1/Y2/Y3.
- Convertir cette erreur en sigma_h stable.

Option B (recommandee moyen terme, meilleure):
- Entrainement quantile (p10, p50, p90) ou conformal prediction.
- Le modele retourne directement une borne basse/haute par horizon.

Priorite produit:
- Commencer par Option A pour aller vite.
- Migrer vers Option B pour fiabilite statistique plus forte.

### 8.5 Explicabilite (SHAP / feature importance)

Affichage conseille:
- Un bar chart horizontal avec contribution positive et negative.
- Tri par impact absolu.
- Labels business-friendly (pas de nom technique brut).

Exemple de lecture:
- Revenues_Momentum_1Y: +0.12 (pousse la croissance)
- LeverageRatio: -0.07 (freine la croissance)

Regle UX:
- Toujours afficher une phrase resume sous le chart:
  - "Les 3 facteurs les plus influents sur cette prediction sont ..."

### 8.6 Comportement exact demande (avant/apres clic bouton)

Avant lancement modele:
- Chart affiche uniquement historique N-2, N-1 (si present en base).
- Zone projection vide avec hint "Lancer la prediction pour voir Y+1 a Y+3".

Apres lancement modele (bouton Run AI Prediction):
- Afficher Y+1, Y+2, Y+3 en lignes coupees (dashed) pour signaler "projection".
- Afficher la courbe realiste + bande d erreur (optimiste/pessimiste).
- Mettre a jour cartes EV/Equity pour les 3 horizons.

En cas echec modele:
- Conserver historique visible.
- Afficher message erreur explicite + action "Reessayer".

### 8.7 Contrat de donnees recommande pour le frontend

Ajouter dans la reponse prediction:
- scenarios: {
  - realistic: { y1, y2, y3 },
  - optimistic: { y1, y2, y3 },
  - pessimistic: { y1, y2, y3 }
}
- confidence: {
  - method: "mae" | "quantile" | "conformal",
  - sigma: { y1, y2, y3 },
  - level: 0.80 | 0.90 | 0.95
}
- explainability: [
  - { feature, impact, direction, label }
]

Si ce contrat n est pas encore disponible:
- Calculer optimistic/pessimistic cote backend a partir des g predits + sigma par horizon.
- Retourner une importance simple en premiere version, puis migrer vers SHAP.

### 8.8 KPI minimum a montrer dans la zone Prediction

1. CAGR Realiste Y+1 / Y+2 / Y+3
2. EV Realiste Y+1 / Y+2 / Y+3
3. Equity Realiste Y+1 / Y+2 / Y+3
4. Plage d incertitude (Best case / Worst case)
5. Top facteurs explicatifs

### 8.9 Recommandation finale (best practice)

La meilleure methode pour ton cas est:
1. Historique 2 ans par defaut (depuis la base).
2. Projection 3 ans en scenarios (optimiste/realiste/pessimiste) apres clic bouton.
3. Bande d erreur visible autour de la courbe realiste.
4. Explicabilite via top features (puis SHAP detaille en V2).
5. Parametres de valorisation modifiables par utilisateur avec recalcul instantane.

Resultat attendu:
- Dashboard plus decisionnel, plus transparent, et plus fiable pour un usage business reel.
