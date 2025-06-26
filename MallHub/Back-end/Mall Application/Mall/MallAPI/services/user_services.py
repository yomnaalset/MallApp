from MallAPI.models.user_model import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

class UserService:
    @staticmethod
    def register_user(validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            role=validated_data['role'],
        )
        return user

    @staticmethod
    def generate_tokens(user):
        refresh = RefreshToken.for_user(user)
        
        # Add custom claims to the token
        refresh.payload.update({
            'role': user.role,
            'name': user.name,
            'email': user.email
        })
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

    @staticmethod
    def authenticate_user(email, password):
        user = authenticate(username=email, password=password)
        if user:
            print(f"User {user.email} authenticated successfully.")
            return UserService.generate_tokens(user)
        else:
            print("Authentication failed.")
        return None