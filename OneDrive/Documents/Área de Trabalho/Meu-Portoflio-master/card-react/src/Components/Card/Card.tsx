import { ArrowUpRight, GithubLogo, LinkedinLogo } from '@phosphor-icons/react'

export type Project = {
  name: string
  description: string | null
  tags: string | null
  imageUrl?: string | null
  projectUrl: string | null
  githubUrl?: string | null
  status?: 'concluido' | 'em-andamento'
  projectIcon?: 'github' | 'linkedin' | 'link'
}

type CardProps = {
  project: Project
}

function TagList({ tags }: { tags: string | null }) {
  if (!tags) return null
  const tagArray = tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  return (
    <div className="project-tags">
      {tagArray.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  )
}

export function Card({ project }: CardProps) {
  return (
    <div className={`project-card ${project.status ? `status-${project.status}` : ''}`}>
      <div className="project-content">
        <div className="project-header">
          <h4>{project.name}</h4>
          <div className="project-links">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="project-link-icon"
                title="Ver no GitHub"
              >
                <GithubLogo weight="bold" />
              </a>
            )}
            {project.projectUrl && (
              <a
                href={project.projectUrl}
                target="_blank"
                rel="noreferrer"
                className="project-link-icon"
                title="Ver projeto"
              >
                {project.projectIcon === 'github' && <GithubLogo weight="fill" />}
                {project.projectIcon === 'linkedin' && <LinkedinLogo weight="fill" />}
                {(!project.projectIcon || project.projectIcon === 'link') && <ArrowUpRight weight="bold" />}
              </a>
            )}
          </div>
        </div>
        <p>{project.description}</p>
        <TagList tags={project.tags} />
      </div>
    </div>
  )
}
