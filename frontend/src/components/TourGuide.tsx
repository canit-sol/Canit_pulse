import { useEffect, useState } from "react";
import { Joyride, CallBackProps, STATUS, Step } from "react-joyride";

interface TourGuideProps {
  clientId: string;
  run: boolean;
  onFinish: () => void;
  setActivePlatform: (platform: string) => void;
  showFacebook: boolean;
  showYoutube: boolean;
}

export default function TourGuide({
  clientId,
  run,
  onFinish,
  setActivePlatform,
  showFacebook,
  showYoutube,
}: TourGuideProps) {
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    const tourSteps: Step[] = [
      {
        target: ".tour-nav-logo",
        title: "Welcome to CANIT Pulse! 👋",
        content: "This interactive onboarding tour will guide you through the dashboard to show you how to extract maximum value for your brand.",
        placement: "bottom",
        disableBeacon: true,
      },
      {
        target: ".tour-month-selector",
        title: "Select Reporting Period 📅",
        content: "Use this control to choose the month you want to review. Our team updates your deliverables and intelligence reports monthly.",
        placement: "bottom",
      },
      {
        target: ".tour-tab-deliverables",
        title: "Deliverables Overview 📋",
        content: "Here you can see the content and marketing tasks we scheduled and achieved for you this month (e.g. reels, posts, articles, newsletters).",
        placement: "bottom",
      },
      {
        target: ".tour-further-changes",
        title: "Any Further Changes Request Box ✍️",
        content: "Need revisions, updates, or have new requests? Enter them directly in this feedback box. It syncs live with our agency team so we can address your requirements immediately!",
        placement: "top",
      },
      {
        target: ".tour-tab-ad-performance",
        title: "Ad Spends & Performance 💳",
        content: "Track your advertising spends, ROI, total impressions, conversions, and campaign stats across paid acquisition channels.",
        placement: "bottom",
      },
      {
        target: ".tour-tab-instagram",
        title: "Instagram Intelligence 📸",
        content: "Deep dive into your Instagram organic performance: tracking reach, follower growth, content calendars, and top-performing posts.",
        placement: "bottom",
      },
    ];

    if (showFacebook) {
      tourSteps.push({
        target: ".tour-tab-facebook",
        title: "Facebook Intelligence 👥",
        content: "Analyze Facebook page metrics, reach, page impressions, and active community engagement indicators.",
        placement: "bottom",
      });
    }

    if (showYoutube) {
      tourSteps.push({
        target: ".tour-tab-youtube",
        title: "YouTube Intelligence 🎥",
        content: "Track your video views, subscribers, watch time, and top video highlights.",
        placement: "bottom",
      });
    }

    tourSteps.push(
      {
        target: ".tour-tab-blogs",
        title: "Blog & SEO Intelligence 🌐",
        content: "Track your blog posts, organic search visibility, SEO keywords, traffic, and search engine trends.",
        placement: "bottom",
      },
      {
        target: ".tour-brand-intel",
        title: "AI Brand Intelligence Workspace 🧠",
        content: "This workspace consolidates multi-channel metrics to generate strategic performance summaries and advice for your brand.",
        placement: "top",
      },
      {
        target: ".tour-brand-health",
        title: "Brand Health Score 🛡️",
        content: "The Brand Health Score aggregates engagement, reach quality, consistency, and growth into a single rating, letting you evaluate performance at a glance.",
        placement: "right",
      },
      {
        target: ".tour-growth-momentum",
        title: "Growth Momentum 📈",
        content: "Growth Momentum displays comparison trends for Reach, Followers, and Engagement compared to your previous reporting period.",
        placement: "top",
      },
      {
        target: ".tour-audience-pulse",
        title: "Audience Pulse 💓",
        content: "Audience Pulse tracks your audience's sentiment, active engagement styles, and community loyalty signals across platforms.",
        placement: "left",
      },
      {
        target: ".tour-ai-recommendations",
        title: "AI Recommendations & Insights 💡",
        content: "Review AI Recommendations to see which formats (e.g. Reels vs. static posts) are driving the most value and what timings you should target next.",
        placement: "right",
      },
      {
        target: ".tour-industry-news",
        title: "Industry Related News 📰",
        content: "Stay ahead of your competitors with daily refreshed industry news, trend monitoring, and saved bookmarks relevant to your business area.",
        placement: "top",
      },
      {
        target: ".tour-ai-chat",
        title: "AI Assistant Chatbot 🤖",
        content: "Need help translating these insights? Click this button to chat with your AI assistant about any charts, metrics, or suggestions in your reports.",
        placement: "left",
      }
    );

    setSteps(tourSteps);
  }, [showFacebook, showYoutube]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    if (type === "step:before") {
      const currentStep = steps[index];
      if (currentStep && typeof currentStep.target === "string") {
        const targetClass = currentStep.target;
        if (targetClass.includes("tour-tab-deliverables") || targetClass.includes("tour-further-changes")) {
          setActivePlatform("deliverables");
        } else if (targetClass.includes("tour-tab-ad-performance")) {
          setActivePlatform("ad-performance");
        } else if (targetClass.includes("tour-tab-instagram")) {
          setActivePlatform("instagram");
        } else if (targetClass.includes("tour-tab-facebook")) {
          setActivePlatform("facebook");
        } else if (targetClass.includes("tour-tab-youtube")) {
          setActivePlatform("youtube");
        } else if (targetClass.includes("tour-tab-blogs")) {
          setActivePlatform("blogs");
        } else if (
          targetClass.includes("tour-brand-intel") ||
          targetClass.includes("tour-brand-health") ||
          targetClass.includes("tour-growth-momentum") ||
          targetClass.includes("tour-audience-pulse") ||
          targetClass.includes("tour-ai-recommendations") ||
          targetClass.includes("tour-industry-news")
        ) {
          setActivePlatform("instagram");
        }
      }
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(`canit_pulse_tour_completed_${clientId}`, "true");
      onFinish();
    }
  };

  return (
    <Joyride
      key={run ? "active" : "inactive"}
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      scrollOffset={140}
      spotlightPadding={8}
      callback={handleJoyrideCallback}
      floaterProps={{
        options: {
          modifiers: {
            offset: {
              offset: "0, 8px",
            },
            preventOverflow: {
              padding: 15,
            },
            flip: {
              behavior: ["top", "bottom", "right", "left"],
            },
          },
        },
      }}
      styles={{
        options: {
          arrowColor: "#ffffff",
          backgroundColor: "#ffffff",
          overlayColor: "rgba(15, 23, 42, 0.65)",
          primaryColor: "#2563EB",
          textColor: "#1e293b",
          zIndex: 10000,
        },
        spotlight: {
          borderRadius: "16px",
        },
        tooltip: {
          borderRadius: "16px",
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          fontFamily: "Outfit, Inter, sans-serif",
          padding: "20px",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: "16px",
          fontWeight: "800",
          color: "#0f172a",
          marginBottom: "8px",
        },
        tooltipContent: {
          fontSize: "13px",
          color: "#475569",
          lineHeight: "1.6",
        },
        buttonNext: {
          backgroundColor: "#2563EB",
          borderRadius: "9999px",
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "700",
          padding: "8px 16px",
          outline: "none",
        },
        buttonBack: {
          color: "#475569",
          fontSize: "12px",
          fontWeight: "700",
          marginRight: "12px",
        },
        buttonSkip: {
          color: "#94a3b8",
          fontSize: "12px",
          fontWeight: "600",
        },
      }}
    />
  );
}
