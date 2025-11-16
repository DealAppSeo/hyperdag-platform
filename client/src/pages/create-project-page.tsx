import { Layout } from "@/components/layout/layout";
import ProjectForm from "@/components/projects/project-form";
import { Card } from "@/components/ui/card";

export default function CreateProjectPage() {
  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
        
        <Card>
          <ProjectForm />
        </Card>
      </div>
    </Layout>
  );
}
