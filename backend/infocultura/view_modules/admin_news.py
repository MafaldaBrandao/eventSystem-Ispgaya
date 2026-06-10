from .admin.content import (
    AdminContentDetailView,
    AdminContentListCreateView,
    AdminPhotoCarouselDetailView,
    AdminPhotoCarouselListCreateView,
)
from .admin.news import (
    AdminNewsBulkDeleteView,
    AdminNewsBulkStatusUpdateView,
    AdminNewsDetailView,
    AdminNewsListCreateView,
    AdminNewsStatusListView,
)

__all__ = [
    'AdminContentDetailView',
    'AdminContentListCreateView',
    'AdminPhotoCarouselDetailView',
    'AdminPhotoCarouselListCreateView',
    'AdminNewsBulkDeleteView',
    'AdminNewsBulkStatusUpdateView',
    'AdminNewsDetailView',
    'AdminNewsListCreateView',
    'AdminNewsStatusListView',
]
