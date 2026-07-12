import { changePassword } from '../firebase-auth';
import { reauthenticateWithCredential, updatePassword, EmailAuthProvider } from 'firebase/auth';

jest.mock('firebase/auth', () => ({
  reauthenticateWithCredential: jest.fn(),
  updatePassword: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn(),
  },
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  onIdTokenChanged: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithCredential: jest.fn(),
}));

jest.mock('../../firebase', () => ({
  auth: {
    currentUser: { email: 'test@example.com' }
  }
}));

describe('changePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (EmailAuthProvider.credential as jest.Mock).mockReturnValue('mock-credential');
    (reauthenticateWithCredential as jest.Mock).mockResolvedValue({});
  });

  it('throws "Password does not meet minimum requirements" error for auth/weak-password', async () => {
    (updatePassword as jest.Mock).mockRejectedValue({ code: 'auth/weak-password' });
    
    await expect(changePassword('old-pass', 'weak')).rejects.toThrow('Password does not meet minimum requirements');
  });
});
