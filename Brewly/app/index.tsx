import { Slot } from 'expo-router';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Landing from './screens/landing_screen';

function RootLayoutNav() {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    // Remove './screens/' from the route names as Expo Router uses the file structure
    return (
        <Slot initialRouteName={user ? "/screens/home_screen" : "/screens/landing_screen"} />
    );
}

export default function Index() {
    return (
        <AuthProvider>
            <Landing />
        </AuthProvider>
    );
}