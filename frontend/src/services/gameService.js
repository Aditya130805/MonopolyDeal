const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

export const createRoom = async () => {
    try {
        const accessToken = localStorage.getItem('accessToken');
        // console.log("Access token:", accessToken);

        const response = await fetch(`${API_BASE_URL}/room/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`, // Include the JWT access token
                'Accept': 'application/json',
            },
            credentials: 'include'
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create room');
        }
        return data;
    } catch (error) {
        console.error('Error creating room:', error);
        throw error;
    }
};

export const joinRoom = async (roomId) => {
    try {
        const accessToken = localStorage.getItem('accessToken');
        // console.log("Access token:", accessToken);
        
        const response = await fetch(`${API_BASE_URL}/room/${roomId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`, // Include the JWT access token
                'Accept': 'application/json',
            },
            credentials: 'include'
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get room');
        }
        return data;
    } catch (error) {
        console.error('Error getting room:', error);
        throw error;
    }
};
