import posthog from 'posthog-js'
import { browser } from '$app/environment';

export const load = async () => {

  if (browser) {
    posthog.init(
      'phc_oykpCINjAf2xeBL2j4p40tKdqId3rhmP5dCVFwH41VN',
      { 
        api_host: 'https://eu.i.posthog.com',
        person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
        persistence: 'localStorage',
      }
    )
  }
  return
};

export const prerender = true;
