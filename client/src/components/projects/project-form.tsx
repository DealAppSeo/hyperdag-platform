import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createProjectSchema, CreateProjectData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useLocation } from "wouter";

// Extending the schema for form validation
const projectFormSchema = createProjectSchema.extend({
  notifyTeam: z.boolean().optional(),
  stakeTokens: z.boolean().optional(),
});

export default function ProjectForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"rfi" | "rfp">("rfi");

  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "rfi",
      categories: [],
      teamRoles: [],
      notifyTeam: false,
      stakeTokens: false,
    },
  });

  async function onSubmit(values: z.infer<typeof projectFormSchema>) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/projects", values);
      const data = await response.json();
      
      toast({
        title: "Project created successfully",
        description: `Your ${values.type.toUpperCase()} "${values.title}" has been submitted.`,
      });
      
      // Invalidate projects query to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // Navigate to projects page
      navigate("/projects");
    } catch (error) {
      toast({
        title: "Error creating project",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleTabChange = (tab: "rfi" | "rfp") => {
    setActiveTab(tab);
    form.setValue("type", tab);
  };

  const categories = [
    { id: "education", label: "Education" },
    { id: "sustainability", label: "Sustainability" },
    { id: "technology", label: "Technology" },
    { id: "health", label: "Health" },
    { id: "energy", label: "Energy" },
  ];

  const teamRoles = [
    { id: "developer", label: "Developer" },
    { id: "designer", label: "Designer" },
    { id: "businessDev", label: "Business Dev" },
    { id: "marketing", label: "Marketing" },
    { id: "investor", label: "Investor" },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Project</h2>
      
      {/* Project Type Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex -mb-px">
          <button
            type="button"
            className={`py-2 px-4 text-center border-b-2 font-medium flex-1 ${
              activeTab === "rfi"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("rfi")}
          >
            Request for Information (RFI)
          </button>
          <button
            type="button"
            className={`py-2 px-4 text-center border-b-2 font-medium flex-1 ${
              activeTab === "rfp"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("rfp")}
          >
            Request for Proposal (RFP)
          </button>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{activeTab === "rfi" ? "Title" : "Project Title"}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={activeTab === "rfi" ? "e.g. Rural coding ideas?" : "e.g. Coding Classes for Rural Schools"} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{activeTab === "rfi" ? "Description" : "Project Description"}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={activeTab === "rfi" ? "Describe what information you're seeking..." : "Describe your project in detail..."} 
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {activeTab === "rfp" && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fundingGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Goal (ETH)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0.01" 
                        placeholder="e.g. 1.0" 
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? undefined : value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        placeholder="e.g. 30" 
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(isNaN(value) ? undefined : value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          <FormField
            control={form.control}
            name="categories"
            render={() => (
              <FormItem>
                <FormLabel>Categories</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <FormField
                      key={category.id}
                      control={form.control}
                      name="categories"
                      render={({ field }) => {
                        return (
                          <label className="inline-flex items-center px-3 py-1.5 border rounded-full cursor-pointer hover:bg-gray-50">
                            <Checkbox
                              checked={field.value?.includes(category.id)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValue, category.id]);
                                } else {
                                  field.onChange(
                                    currentValue.filter((value) => value !== category.id)
                                  );
                                }
                              }}
                              className="sr-only peer"
                            />
                            <span className="text-sm text-gray-700 peer-checked:text-primary">
                              {category.label}
                            </span>
                          </label>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {activeTab === "rfp" && (
            <FormField
              control={form.control}
              name="teamRoles"
              render={() => (
                <FormItem>
                  <FormLabel>Team Roles Needed</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {teamRoles.map((role) => (
                      <FormField
                        key={role.id}
                        control={form.control}
                        name="teamRoles"
                        render={({ field }) => {
                          return (
                            <label className="inline-flex items-center px-3 py-1.5 border rounded-full cursor-pointer hover:bg-gray-50">
                              <Checkbox
                                checked={field.value?.includes(role.id)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, role.id]);
                                  } else {
                                    field.onChange(
                                      currentValue.filter((value) => value !== role.id)
                                    );
                                  }
                                }}
                                className="sr-only peer"
                              />
                              <span className="text-sm text-gray-700 peer-checked:text-secondary">
                                {role.label}
                              </span>
                            </label>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control}
            name="notifyTeam"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Notify potential team members with matching interests</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="stakeTokens"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Stake 5 HDAG tokens to boost visibility</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              `Submit ${activeTab.toUpperCase()}`
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
