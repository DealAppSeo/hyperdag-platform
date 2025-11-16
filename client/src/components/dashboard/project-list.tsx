import { Project } from "@shared/schema";
import { Link } from "wouter";

interface ProjectListProps {
  projects: Project[];
  showAll?: boolean;
  title?: string;
}

export default function ProjectList({ projects, showAll = true, title = "Recent Projects" }: ProjectListProps) {
  const displayProjects = showAll ? projects : projects.slice(0, 3);
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h3 className="font-semibold text-lg">{title}</h3>
        {!showAll && projects.length > 3 && (
          <Link href="/projects" className="text-primary text-sm hover:underline">
            View All
          </Link>
        )}
      </div>
      
      {displayProjects.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No projects found</p>
          <Link href="/create-project" className="mt-4 inline-block text-primary hover:underline">
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {displayProjects.map((project) => (
            <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{project.title}</h4>
                  <p className="text-gray-500 text-sm mt-1">{project.description}</p>
                  <div className="flex items-center mt-2">
                    {project.categories.map((category) => (
                      <span 
                        key={category} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
                
                {project.fundingGoal && (
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-gray-500">
                      Funded: {Math.round((project.currentFunding / project.fundingGoal) * 100)}%
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${Math.round((project.currentFunding / project.fundingGoal) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 mt-1">
                      {project.currentFunding} / {project.fundingGoal} ETH
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
