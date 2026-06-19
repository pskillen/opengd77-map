import { Navigate, Outlet } from 'react-router-dom';
import { useProjects } from '../../state/codeplugStore.tsx';

export default function RequireActiveProject() {
  const { activeProjectId } = useProjects();

  if (activeProjectId == null) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
