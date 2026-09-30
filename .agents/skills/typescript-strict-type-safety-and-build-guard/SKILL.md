---
name: typescript-strict-type-safety-and-build-guard
description: Directives d'ingénierie strictes pour l'intégrité TypeScript, la prévention des incompatibilités de typage (string | undefined vs string), la gestion des options nullish, le typage défensif d'API et la vérification systématique avant chaque validation et déploiement.
---

# TypeScript Strict Type Safety & Build Integrity Guard

Ce skill définit les standards obligatoires de typage et de validation statique pour garantir que **100% des builds Next.js / TypeScript réussissent** sans aucune erreur de compilation (type mismatch, assignation de `string | undefined` à `string`, propriétés manquantes ou hooks invalides).

---

## 1. Contexte & Cause Racine de l'Erreur de Build

### A. Symptôme Observé
Lors de la phase de compilation TypeScript en CI/CD :
```text
Type error: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
  at src/lib/facebook/client.ts (508:9)
```

### B. Analyse de la Cause Racine
1. **Signature stricte du récepteur** :
   La fonction utilitaire `graph` attendait un objet strictement typé `Record<string, string>` :
   ```typescript
   async function graph(path: string, params: Record<string, string>, init?: RequestInit)
   ```
2. **Propriété optionnelle de l'appelant** :
   L'interface `PublishStoryInput` définissait `imageUrl?: string`, ce qui équivaut à `string | undefined`.
3. **Assignation directe sans garde** :
   ```typescript
   const data = await graph(`/${input.pageId}/photos`, {
     url: input.imageUrl, // ❌ ERREUR : 'string | undefined' n'est pas assignable à 'string'
     access_token: input.pageToken,
     published: "true",
   });
   ```

---

## 2. Règles Inviolables de Typage Défensif

### Règle 1 : Traitement Systématique des Propriétés Optionnelles (`??`)
Ne jamais assigner directement une propriété optionnelle (`T | undefined` ou `T | null`) à une cible attendant un type primitif strict (`string`, `number`, `boolean`) sans :
1. **Opérateur de coalescence des nuls (`??`)** :
   ```typescript
   url: input.imageUrl ?? ""
   ```
2. **OU un Type Guard / Narrowing explicite préalable** :
   ```typescript
   const imageUrl = input.imageUrl?.trim();
   if (!imageUrl) {
     throw new Error("L'URL de l'image est requise pour cette opération.");
   }
   // Ici, TypeScript sait que imageUrl est strictement 'string'
   url: imageUrl
   ```

### Règle 2 : Fonctions Utilitaires & Wrappers Réseau Permissifs
Pour les fonctions de bas niveau manipulant des dictionnaires de paramètres (comme `graph`, `fetchWithParams`, `toQueryString`) :
- Toujours autoriser les valeurs optionnelles ou nulles dans la signature :
  ```typescript
  // ✅ Recommandé :
  params: Record<string, string | number | boolean | undefined | null>
  ```
- Filtrer automatiquement les valeurs indéfinies / nulles lors de la construction des paramètres (`URLSearchParams`, `FormData`, etc.) :
  ```typescript
  const cleanParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      cleanParams.append(key, String(value));
    }
  }
  ```

### Règle 3 : Cohérence entre Schémas Zod et Types TypeScript
Lors de la validation de corps de requêtes d'API :
- Si un champ Zod est `.optional()`, son type déduit est `T | undefined`.
- Lors de l'envoi à une fonction métier interne, toujours fournir une valeur par défaut ou valider la présence avant l'appel :
  ```typescript
  targetCities: parsed.data.targetCities || []
  ```

### Règle 4 : Pas de `any` Non Contrôlé
- Bannir les casts sauvages `as any`.
- Préférer `unknown` combiné avec des vérifications de type (`typeof`, `instanceof`, `Array.isArray`) ou des types génériques stricts.

---

## 3. Protocole Obligatoire de Vérification Pré-Validation (Checklist)

Avant d'achever toute tâche et d'effectuer un commit / push :

1. **Revue Ciblée des Différences (`git diff`)** :
   - Inspecter chaque ligne modifiée recevant des arguments.
   - Identifier tous les objets littéraux passés en paramètres (`{ url, token, ... }`).
   - Vérifier si les variables proviennent d'interfaces avec des `?` (champs optionnels).
2. **Contrôle des Null / Undefined** :
   - Vérifier si chaque variable optionnelle a un fallback sécurisé (`?? ""`, `|| 0`, ou clause de garde `if (!x) return/throw`).
3. **Validation des En-têtes et Envois Graph API** :
   - `URLSearchParams` ne doit jamais recevoir des chaînes `'undefined'` littérales.
   - S'assurer que les tokens et identifiants obligatoires (`pageId`, `pageToken`, `adAccountId`) sont guardés en amont.
4. **Validation de non-régression** :
   - S'assurer que les fichiers `.d.ts`, `types.ts` et `schema.sql` sont synchronisés.
