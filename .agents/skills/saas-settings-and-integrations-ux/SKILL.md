---
name: saas-settings-and-integrations-ux
description: Directives d'ingénierie et de design produit pour les hubs de paramètres (Settings) et intégrations SaaS (Meta, WhatsApp, Webhooks, CMS). Normes visuelles Linear, Stripe et Vercel, accessibilité, réduction de la charge cognitive et liens d'assistance directs.
---

# SaaS Settings & Integrations UX Design System (Linear & Stripe Standard)

Ce skill définit les standards architecturaux, ergonomiques et visuels obligatoires pour toutes les interfaces de paramètres, de configuration de comptes et de connexions tierces (Facebook Meta, WhatsApp Cloud API, Webhooks CMS, IA).

---

## 1. Diagnostic des Erreurs et Anti-Patterns Fréquents

1. **Information Overload & Écran Plat (Dark-on-Dark)** :
   - Empiler des dizaines d'inputs et boutons sans hiérarchie dans des boîtes sombres étouffantes.
   - *Règle :* Utiliser des panneaux à contrastes dosés (`surface`, `surface-2`), des bordures ultra-fines (`border-border/60`), des respirations généreuses (padding 6, gap 6) et des micro-accents lumineux ciblés.

2. **Absence de Liens Directs & Sentiment d'Abandon** :
   - Demander à l'utilisateur de saisir un "App ID", un "Access Token" ou une "Clé API" sans lui donner le lien direct ouvrant la console exacte où cette valeur est générée.
   - *Règle :* Tout champ requérant une clé externe DOIT être accompagné d'un lien sortant direct (`target="_blank"` avec `ArrowUpRight`) vers la console exacte (ex: Meta Developers Console, Graph API Explorer, WhatsApp Cloud API).

3. **Boutons Flottants et Éléments Désordonnés** :
   - Boutons d'action dispersés sans hiérarchie (primaire, secondaire, destructeur).
   - *Règle :* Chaque carte possède une ligne d'état supérieure dédiée, une zone de données au centre, et des actions clairement regroupées avec des libellés explicites.

4. **Complexité Développeur imposée aux Novices** :
   - Afficher les clés secrètes, tokens bruts et paramètres d'endpoints directement au premier plan.
   - *Règle :* Appliquer la **divulgation progressive (Progressive Disclosure)** :
     - Écran standard : Statut de connexion en 1 clic, nom du compte connecté, page active.
     - Tiroir technique ("Options développeur & clés manuelles") : Replié par défaut, dépliable en 1 clic sans rechargement.

---

## 2. Standards Visuels Obligatoires pour les Cartes d'Intégration

### A. Structure Canonique d'une IntegrationCard
Chaque service connecté (Meta, WhatsApp, Yamoura Webhook, WordPress) doit comporter :

```
+-----------------------------------------------------------------------------------+
| [Icon Service]  Titre du Service                      [Badge Statut Dynamique]   |
|                 Sous-titre et rôle de la connexion                               |
+-----------------------------------------------------------------------------------+
| BLOC ÉTAT / IDENTITÉ :                                                            |
|  - Compte connecté / ID                                                          |
|  - Page / Numéro de diffusion cible                                               |
|  - Permissions vérifiées                                                          |
+-----------------------------------------------------------------------------------+
| BLOC GUIDAGE & LIENS D'AIDE RAPIDE :                                              |
|  [↗ Console Développeurs]   [↗ Graph API Explorer]   [↗ Meta Business Suite]      |
+-----------------------------------------------------------------------------------+
| BLOC ACTIONS :                                                                    |
|  [Bouton Primaire : Configurer/Changer]   [Bouton Secondaire]   [Déconnecter]    |
+-----------------------------------------------------------------------------------+
| [v] Réglages avancés & Identifiants personnalisés (Repliable)                     |
+-----------------------------------------------------------------------------------+
```

### B. Badges de Statut Normalisés
- **🟢 Connecté & Opérationnel** :
  `bg-emerald-500/10 text-emerald-500 border border-emerald-500/20` avec `CheckCircle` (weight="fill").
- **🟡 Configuration Requise / Attention** :
  `bg-amber-500/10 text-amber-500 border border-amber-500/20` avec `WarningCircle` (weight="bold").
- **⚪ Non Connecté / Inactif** :
  `bg-surface-3 text-muted-foreground border border-border` avec `LinkBreak`.

### C. Liens Directs Officiels Requis par Fournisseur
- **Meta / Facebook** :
  - Console Apps : `https://developers.facebook.com/apps/`
  - Graph API Explorer : `https://developers.facebook.com/tools/explorer/`
  - Access Token Debugger : `https://developers.facebook.com/tools/debug/accesstoken/`
  - Meta Business Suite (Pages) : `https://business.facebook.com/latest/settings/pages`
- **WhatsApp Cloud API** :
  - Console WhatsApp : `https://developers.facebook.com/docs/whatsapp/cloud-api`
  - Gestionnaire WhatsApp Business : `https://business.facebook.com/wa/manage/`
- **Webhooks & Sources de Contenus** :
  - Bouton 1-clic pour copier l'URL complète avec confirmation visuelle immédiate ("Copié !").

---

## 3. Typage et Robustesse
- Tous les composants doivent supporter des valeurs partielles ou undefined (`user_name ?? "Administrateur"`).
- Séparation stricte des états d'action (loading, success, error) avec retours textuels et visuels clairs.
- Aucun composant ou bouton orphelin ne doit être rendu hors flux.
