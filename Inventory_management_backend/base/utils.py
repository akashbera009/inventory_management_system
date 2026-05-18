from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class LargeResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 10

    def get_paginated_response(self, data):
        return Response({
            "message": "success",
            "page": self.page.number,  # current page number
            "page_size": self.get_page_size(self.request),
            "total_pages": self.page.paginator.num_pages,
            "total_items": self.page.paginator.count,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "data": data
        })