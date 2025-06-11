"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  completeVideoFormSchema,
  type CompleteVideoForm,
} from "@/lib/zod/create-video";

// Import step components
import { ConceptStep } from "@/components/create/ConceptStep";
import { StoryboardStep } from "@/components/create/StoryboardStep";
import { SettingsStep } from "@/components/create/SettingsStep";
import { BreakdownStep } from "@/components/create/BreakdownStep";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/trpc/react";

const STEPS = ["CONCEPT", "STORYBOARD", "SETTINGS & CAST", "BREAKDOWN"];

// Map project status to step index
const STATUS_TO_STEP = {
  storyboard: 1,
  settings: 2,
  breakdown: 3,
} as const;

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const videoIdParam = searchParams.get("v");

  const { open } = useSidebar();
  const isMobile = useIsMobile();

  // One comprehensive form for all steps
  const form = useForm<CompleteVideoForm>({
    resolver: zodResolver(completeVideoFormSchema),
    defaultValues: {
      concept: {
        option: "ai",
        content: "",
        format: "custom",
        customFormat: "",
        genre: "",
        tone: "",
        voiceId: "",
        commercialTargetAudience: "",
        commercialMessage: "",
        commercialBrand: "",
        commercialCallToAction: "",
      },
      storyboard: {
        variants: [],
        selectedVariantId: "",
        customContent: "",
      },
      settings: {
        projectName: "",
        videoModel: "kling-1.6",
        aspectRatio: "16:9",
        videoStyle: "none",
        cinematicInspiration: "",
        characters: [],
      },
      breakdown: {
        scenes: [],
        musicDescription: "",
      },
    },
  });

  // Fetch project data if videoId is in query params
  const { data: project, isLoading: projectLoading } =
    api.video.getProject.useQuery(
      { id: videoIdParam! },
      {
        enabled: !!videoIdParam,
        retry: false,
      },
    );

  // Handle project loading and smart routing
  useEffect(() => {
    if (!videoIdParam) return;

    if (projectLoading) {
      setIsLoadingProject(true);
      return;
    }

    if (!project) {
      toast.error("Project not found");
      // Remove invalid query param and start fresh
      router.replace("/dashboard/create");
      return;
    }

    // Check project status and redirect if necessary
    if (
      project.status === "generating" ||
      project.status === "completed" ||
      project.status === "failed"
    ) {
      router.push(`/dashboard/videos/${videoIdParam}`);
      return;
    }

    // Load project data into form
    if (project.concept) {
      form.reset({
        concept: project.concept,
        storyboard: project.storyboard ?? {
          variants: [],
          selectedVariantId: "",
          customContent: "",
        },
        settings: project.settings ?? {
          projectName: "",
          videoModel: "kling-1.6",
          aspectRatio: "16:9",
          videoStyle: "none",
          cinematicInspiration: "",
          characters: [],
        },
        breakdown: project.breakdown ?? {
          scenes: [],
          musicDescription: "",
        },
      });
    }

    // Set current step based on project status
    const stepIndex = STATUS_TO_STEP[project.status];

    if (stepIndex !== undefined) {
      setCurrentStep(stepIndex);
    }

    setProjectId(project.id);
    setIsLoadingProject(false);
  }, [project, projectLoading, router, videoIdParam, form]);

  const createProjectMutation = api.video.create.useMutation({
    onSuccess: (data) => {
      form.setValue("storyboard.variants", data.storyboardVariants);
      setProjectId(data.projectId);

      // Add project ID to URL as query param
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("v", data.projectId);
      router.replace(newUrl.pathname + newUrl.search);

      setCurrentStep(1);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  const updateStoryboardMutation = api.video.updateStoryboard.useMutation({
    onSuccess: () => {
      setCurrentStep(2);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save storyboard");
    },
  });

  const updateSettingsMutation = api.video.updateSettings.useMutation({
    onSuccess: () => {
      setCurrentStep(3);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  const finalizeProjectMutation =
    api.video.updateBreakdownAndGenerate.useMutation({
      onSuccess: () => {
        toast.success("Video generation started!");
        if (projectId) {
          router.push(`/dashboard/videos/${projectId}`);
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to start video generation");
      },
    });

  const stepHandlers = {
    0: async () => {
      const isValid = await form.trigger("concept");
      if (isValid) {
        const conceptData = form.getValues("concept");
        createProjectMutation.mutate(conceptData);
      }
    },
    1: async () => {
      const isValid = await form.trigger("storyboard");
      if (isValid && projectId) {
        const storyboardData = form.getValues("storyboard");
        if (storyboardData) {
          updateStoryboardMutation.mutate({
            projectId,
            storyboard: storyboardData,
          });
        }
      }
    },
    2: async () => {
      const isValid = await form.trigger("settings");
      if (isValid && projectId) {
        const settingsData = form.getValues("settings");
        if (settingsData) {
          updateSettingsMutation.mutate({
            projectId,
            settings: settingsData,
          });
        }
      }
    },
    3: async () => {
      const isValid = await form.trigger();
      if (isValid && projectId) {
        const breakdownData = form.getValues("breakdown");
        if (breakdownData) {
          finalizeProjectMutation.mutate({
            projectId,
            breakdown: breakdownData,
          });
        }
      }
    },
  } as const;

  const handleNextStep = async () => {
    const handler = stepHandlers[currentStep as keyof typeof stepHandlers];
    if (handler) {
      await handler();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <ConceptStep form={form} />;
      case 1:
        return <StoryboardStep form={form} />;
      case 2:
        return <SettingsStep form={form} />;
      case 3:
        return <BreakdownStep form={form} />;
      default:
        return <ConceptStep form={form} />;
    }
  };

  // Show loading state when loading existing project
  if (isLoadingProject) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  const isGenerating =
    createProjectMutation.isPending ||
    updateStoryboardMutation.isPending ||
    updateSettingsMutation.isPending ||
    finalizeProjectMutation.isPending;

  return (
    <div className="flex flex-col">
      {/* Sticky Header */}
      <div className="bg-background sticky top-16 z-20 border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              {STEPS.map((step, index) => (
                <React.Fragment key={step}>
                  <div
                    className={`relative py-2 md:py-3 ${
                      index === currentStep
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="text-xs">{step}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="mx-1 h-3 w-3 flex-shrink-0 text-green-500 md:mx-3 md:h-4 md:w-4" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        <div
          className="relative z-10 container mx-auto max-w-4xl px-4 py-8"
          style={{
            minHeight: "calc(100vh - 140px)",
            paddingBottom: "calc(2rem + 60px)",
          }}
        >
          <Form {...form}>
            <form className="space-y-8">{renderStep()}</form>
          </Form>
        </div>

        {/* Sticky Footer */}
        <div
          className={`bg-background/95 fixed right-0 bottom-0 left-0 z-40 h-[60px] border-t shadow-md backdrop-blur-sm transition-all duration-300 ${
            !isMobile && open && "left-64"
          }`}
        >
          <div className="mx-auto h-full px-4 py-3">
            <div className="flex h-full items-center justify-end gap-4">
              {/* Back button - only show after concept step and when not generating */}
              {currentStep > 0 && !isGenerating && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setCurrentStep((prev) => Math.max(prev - 1, 0))
                  }
                >
                  Back
                </Button>
              )}

              <Button
                type="button"
                className="bg-primary hover:bg-primary/90 px-6"
                disabled={isGenerating}
                onClick={handleNextStep}
              >
                {currentStep < STEPS.length - 1 ? (
                  <>
                    {isGenerating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    {isGenerating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Generate Video
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
