import { defineCliConfig } from 'sanity/cli'

/**
 * CLI du Studio : projet et dataset lus dans `.env.local` (jamais commité), hôte
 * groove-to-grave.sanity.studio. Mises à jour automatiques du Studio déployé.
 */
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  studioHost: 'groove-to-grave',
  // Identifiant du Studio déployé (sanity deploy), pour les redéploiements et les mises à jour automatiques.
  deployment: { appId: 'mcgtccw7e4vjsga37isfzoh4' },
  autoUpdates: true,
})
