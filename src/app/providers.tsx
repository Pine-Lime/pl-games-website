// app/providers.tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import PostHogPageView from "./PostHogPageView"

export function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
    useEffect(() => {
      if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        person_profiles: 'identified_only',
        capture_pageview: false // Disable automatic pageview capture, as we capture manually
      })
  }, [])

  return (
    <PostHogProvider client={posthog}>
        <PostHogPageView />
        {children}
    </PostHogProvider>
  )
}