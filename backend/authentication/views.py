from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.conf import settings


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Simple health check endpoint"""
    return Response({
        'status': 'healthy',
        'version': '1.0.0',
        'environment': 'development' if settings.DEBUG else 'production'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Simple token-based login"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'Email and password required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        user = authenticate(username=user.username, password=password)
        
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            })
        else:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except User.DoesNotExist:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Simple user registration"""
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not email or not password:
        return Response({
            'error': 'Email and password required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({
            'error': 'User with this email already exists'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create user
    user = User.objects.create_user(
        username=email,  # Using email as username
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    
    # Create token
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout and delete token"""
    try:
        token = Token.objects.get(user=request.user)
        token.delete()
        return Response({'message': 'Logged out successfully'})
    except Token.DoesNotExist:
        return Response({'message': 'Already logged out'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get current user profile"""
    return Response({
        'id': request.user.id,
        'email': request.user.email,
        'first_name': request.user.first_name,
        'last_name': request.user.last_name,
        'date_joined': request.user.date_joined,
    })
