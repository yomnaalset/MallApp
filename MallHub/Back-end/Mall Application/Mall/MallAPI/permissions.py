from rest_framework import permissions

class IsStoreManagerOrAdmin(permissions.BasePermission):
    message = 'Only store managers and admins can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.role == 'STORE_MANAGER')
        )

class IsStoreManager(permissions.BasePermission):
    message = 'Only store managers can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'STORE_MANAGER'
        )

class IsNormalUser(permissions.BasePermission):
    message = 'Only customers can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'CUSTOMER'
        )

class IsStoreManagerOrNormalUser(permissions.BasePermission):
    message = 'Only store managers or customers can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['STORE_MANAGER', 'CUSTOMER']
        )

class IsAdmin(permissions.BasePermission):
    message = 'Only admin users can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.role == 'ADMIN')
        )

class IsDeliveryUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'DELIVERY'

class IsAdminOrStoreManagerOrNormalUser(permissions.BasePermission):
    message = 'Only admin, store managers or customers can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.role in ['ADMIN', 'STORE_MANAGER', 'CUSTOMER'])
        )

class IsOwnerOrAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    Read-only access is allowed for any request.
    """
    message = 'You do not have permission to modify this object.'

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object or an admin.
        # Assumes the object has a 'user' attribute.
        return obj.user == request.user or request.user.is_staff or request.user.role == 'ADMIN'



    