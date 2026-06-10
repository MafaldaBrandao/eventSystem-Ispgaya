import ActivitiesPage, { type ActivitiesPageProps } from '../ActivitiesPage';

type SessionsPageProps = Omit<ActivitiesPageProps, 'activityTab'>;

function SessionsPage(props: SessionsPageProps) {
  return <ActivitiesPage {...props} activityTab="sessions" />;
}

export default SessionsPage;
