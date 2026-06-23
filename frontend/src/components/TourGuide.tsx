import { useCallback, useMemo, useState } from "react";
import { Joyride as ReactJoyride, STATUS, EVENTS, ACTIONS } from "react-joyride";
import type { Step, CallBackProps } from "react-joyride";

const waitForElement = (selector: string, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const el = document.querySelector(selector);
      if (el && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0) {
        resolve();
        return;
      }
      if (Date.now() - start > timeout) {
        reject(new Error(`Timeout waiting for ${selector}`));
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });
};

interface TourGuideProps {
  run: boolean;
  setRun: (run: boolean) => void;
  brandName: string;
  visiblePlatforms: Array<{ id: string; label: string }>;
  activePlatform: string;
  setActivePlatform: (platform: string) => void;
  onTourEnd?: () => void;
}

const TOUR_KEY = "canit-pulse-tour-completed";

const platformDescriptions: Record<string, string> = {
  deliverables: "Track your monthly deliverables, milestones, and completed tasks.",
  "ad-performance": "Monitor ad spend, ROI, and campaign performance metrics.",
  instagram: "View Instagram analytics, engagement rates, follower growth, and top posts.",
  facebook: "Analyze Facebook page performance, reach, comments, and audience engagement.",
  youtube: "Track video views, subscriber counts, and channel performance.",
  blogs: "Review blog performance, search traffic, keyword rankings, and SEO metrics.",
};

export default function TourGuide({
  run,
  setRun,
  brandName,
  visiblePlatforms,
  activePlatform,
  setActivePlatform,
  onTourEnd,
}: TourGuideProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = useMemo(() => {
    const s: Step[] = [
      {
        target: ".joyride-branding",
        title: "Welcome to CANIT Pulse",
        content: `Your brand intelligence dashboard for ${brandName}. This tour will walk you through the key features.`,
        placement: "bottom",
        skipBeacon: true,
        skipScroll: true,
        closeButtonAction: "skip" as const,
      },
      {
        target: ".joyride-client-branding",
        title: "Your Brand",
        content: "Your brand name and logo are displayed here.",
        placement: "bottom",
        skipBeacon: true,
        skipScroll: true,
        closeButtonAction: "skip" as const,
      },
      {
        target: ".joyride-month-selector",
        title: "Month Selector",
        content: "Browse reports from previous months using the arrows or click the month name to see a full list of available periods.",
        placement: "bottom",
        skipBeacon: true,
        skipScroll: true,
        closeButtonAction: "skip" as const,
      },
    ];

    for (const p of visiblePlatforms) {
      s.push({
        target: `.joyride-tab-${p.id}`,
        title: `${p.label}`,
        content: platformDescriptions[p.id] || `View ${p.label} analytics and insights.`,
        placement: "bottom" as const,
        skipBeacon: true,
        skipScroll: true,
        closeButtonAction: "skip" as const,
        data: { platform: p.id },
      });
    }

    for (const p of visiblePlatforms) {
      if (p.id === "deliverables") {
        s.push({
          target: ".joyride-deliverables-progress",
          before: async () => { await waitForElement(".joyride-deliverables-progress"); },
          title: "Progress Tracker",
          content: "See how much of your monthly deliverables are complete at a glance with the visual progress bar and completion percentage.",
          placement: "top",
          skipBeacon: true,
          closeButtonAction: "skip" as const,
          data: { platform: "deliverables" },
        });
        s.push({
          target: ".joyride-deliverables-tasks",
          before: async () => { await waitForElement(".joyride-deliverables-tasks"); },
          title: "Task Management",
          content: "Each deliverable has a checkbox to mark tasks as done, an editable title field with auto-save, and a delete button — all synced in real time.",
          placement: "top",
          skipBeacon: true,
          closeButtonAction: "skip" as const,
          data: { platform: "deliverables" },
        });
        s.push({
          target: ".joyride-deliverables-notes",
          before: async () => { await waitForElement(".joyride-deliverables-notes"); },
          title: "Change Requests & Notes",
          content: "Submit change requests, revision notes, or any additional context for your team. Everything you write here is saved automatically.",
          placement: "top",
          skipBeacon: true,
          closeButtonAction: "skip" as const,
          data: { platform: "deliverables" },
        });
      }

      if (p.id === "instagram") {
        s.push({
          target: ".joyride-instagram-posts",
          before: async () => { await waitForElement(".joyride-instagram-posts"); },
          title: "Instagram Posts",
          content: "Browse all Instagram posts from this period with engagement metrics, media previews, and AI-powered performance insights for each post.",
          placement: "top",
          skipBeacon: true,
          closeButtonAction: "skip" as const,
          data: { platform: "instagram" },
        });
        s.push({
          target: ".joyride-ai-snippet",
          before: async () => { await waitForElement(".joyride-ai-snippet"); },
          title: "AI Analytics",
          content: "Each platform includes AI-generated analytics and recommendations based on your content performance — helping you optimize your strategy.",
          placement: "top",
          skipBeacon: true,
          closeButtonAction: "skip" as const,
          data: { platform: "instagram" },
        });
      }
    }

    s.push({
      target: ".joyride-ai-brand-intelligence",
      title: "AI Brand Intelligence",
      content: "Get a unified AI-powered analysis of your brand's performance across all platforms — combining Instagram, Facebook, and web metrics into actionable insights.",
      placement: "top",
      skipBeacon: true,
      closeButtonAction: "skip" as const,
    });

    s.push({
      target: ".joyride-industry-news",
      title: "Industry News",
      content: "Stay updated with relevant industry news and trends curated for your brand, powered by AI-driven content aggregation.",
      placement: "top",
      skipBeacon: true,
      closeButtonAction: "skip" as const,
    });

    s.push({
      target: ".joyride-ai-chat",
      title: "AI Assistant",
      content: "Ask our AI assistant anything about your stats, top posts, or performance trends. Get instant analytics and insights.",
      placement: "left",
      skipBeacon: true,
      skipScroll: true,
      closeButtonAction: "skip" as const,
    });

    return s;
  }, [brandName, visiblePlatforms]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, action, index } = data;

    if (type === EVENTS.STEP_AFTER) {
      const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;
      const nextPlatform = (steps[nextIndex] as any)?.data?.platform as string | undefined;
      if (nextPlatform && nextPlatform !== activePlatform) {
        setActivePlatform(nextPlatform);
      }
      setStepIndex(nextIndex);
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(TOUR_KEY, "true");
      setStepIndex(0);
      setRun(false);
      onTourEnd?.();
    }
  }, [activePlatform, setActivePlatform, setRun, onTourEnd, steps]);

  return (
    <ReactJoyride
      steps={steps}
      stepIndex={stepIndex}
      run={run}
      onEvent={handleJoyrideCallback}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep={false}
      disableOverlayClose
      spotlightClicks
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#113a87",
          textColor: "#1a1a1a",
          backgroundColor: "#ffffff",
          arrowColor: "#ffffff",
        },
        tooltipContainer: { textAlign: "left" },
        tooltipContent: { padding: "16px 20px", fontSize: "14px", lineHeight: "1.5" },
        buttonNext: {
          backgroundColor: "#113a87",
          fontSize: "13px",
          fontWeight: 700,
          padding: "8px 20px",
          borderRadius: "10px",
        },
        buttonBack: { color: "#64748b", fontSize: "13px", fontWeight: 600 },
        buttonSkip: { color: "#94a3b8", fontSize: "12px", fontWeight: 500 },
        tooltip: {
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.08)",
        },
        spotlight: { borderRadius: "12px" },
      }}
      locale={{
        last: "Done",
        skip: "Skip tour",
        next: "Next",
        back: "Back",
      }}
    />
  );
}
