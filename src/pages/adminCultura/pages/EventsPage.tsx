import ActivitiesPage, { type ActivitiesPageProps } from '../ActivitiesPage';

type EventsPageProps = Omit<ActivitiesPageProps, 'activityTab'>;

function EventsPage(props: EventsPageProps) {
  return <ActivitiesPage {...props} activityTab="events" />;
}

export default EventsPage;
