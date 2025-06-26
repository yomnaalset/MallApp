from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from MallAPI.serializers.user_serializers import UserSerializer, LoginSerializer, PasswordResetRequestSerializer, PasswordResetSerializer, UserProfileSerializer, CustomerAccountSerializer
from MallAPI.services.user_services import UserService
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from MallAPI.models.user_model import User
from MallAPI.permissions import IsStoreManagerOrNormalUser, IsStoreManager, IsNormalUser
from MallAPI.utils import format_error_message

class RegisterView(APIView):
    permission_classes = [AllowAny]  # Allow any user to register

    def post(self, request):
        try:
            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                user_data = {
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                }
                return Response({
                    "message": "User registration successful",
                    "user": user_data
                }, status=status.HTTP_201_CREATED)
            
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    permission_classes = [AllowAny]  # Allow any user to login

    def post(self, request):
        try:
            serializer = LoginSerializer(data=request.data)
            if serializer.is_valid():
                tokens = UserService.authenticate_user(
                    email=serializer.validated_data['email'],
                    password=serializer.validated_data['password']
                )
                if tokens:
                    return Response({
                        "message": "Login successful",
                        "tokens": tokens
                    }, status=status.HTTP_200_OK)
                return Response(
                    format_error_message("Invalid credentials"),
                    status=status.HTTP_401_UNAUTHORIZED
                )
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = PasswordResetRequestSerializer(data=request.data)
            if serializer.is_valid():
                user = User.objects.get(email=serializer.validated_data['email'])
                token = PasswordResetTokenGenerator().make_token(user)
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                reset_link = f"http://localhost:5173/auth/reset-password/{uidb64}/{token}"
                send_mail(
                    'Password Reset Request',
                    f'Use the link below to reset your password:\n{reset_link}',
                    'your-email@gmail.com',  # Replace with your Gmail address
                    [user.email],
                    fail_silently=False,
                )
                return Response({"message": "Password reset link sent."}, status=status.HTTP_200_OK)
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response(format_error_message("User not found"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        try:
            serializer = PasswordResetSerializer(data={**request.data, 'uidb64': uidb64, 'token': token})
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerOrNormalUser]

    def get(self, request):
        try:
            serializer = UserProfileSerializer(request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        try:
            serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomerAccountView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def get(self, request):
        """Get customer account information"""
        try:
            serializer = CustomerAccountSerializer(request.user)
            return Response({
                "status": "success",
                "account_info": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
