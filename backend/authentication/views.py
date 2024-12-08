from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer, PasswordUpdateSerializer

# Create your views here.

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class UserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class PasswordUpdateView(generics.UpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = PasswordUpdateSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            serializer.save()
            return Response({'detail': 'Password updated successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PasswordVerifyView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, *args, **kwargs):
        password = request.data.get('password')
        
        if not password:
            return Response(
                {'error': 'Password is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not request.user.check_password(password):
            return Response(
                {'error': 'Incorrect password'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return Response({'detail': 'Password verified'}, status=status.HTTP_200_OK)


class DeleteAccountView(generics.DestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        return self.request.user
    
    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        password = request.data.get('password')
        
        if not password:
            return Response(
                {'error': 'Current password is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not user.check_password(password):
            return Response(
                {'error': 'Current password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user.delete()
            return Response({'detail': 'Account deleted successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
