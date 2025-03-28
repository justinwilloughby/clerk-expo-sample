import { SignedIn, SignedOut, useClerk, useUser, useOrganization, useAuth, useSession } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native'

function ProfileSection({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

export default function Page() {
  const { signOut } = useClerk()
  const { user } = useUser()
  const { session } = useSession()
  const { organization } = useOrganization()

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: Date | null | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })
  }

  return (
    <View style={styles.container}>
      <SignedIn>
        <View style={styles.profileHeader}>
          {user?.imageUrl ? (
            <Image 
              source={{ uri: user.imageUrl }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImagePlaceholderText}>
                {user?.firstName?.[0] || ''}
              </Text>
            </View>
          )}
          <Text style={styles.profileName}>
            {user?.firstName} {user?.lastName}
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <DetailRow 
            label="Email" 
            value={user?.emailAddresses[0].emailAddress || ''} 
          />
          <DetailRow 
            label="Last signed in" 
            value={formatDate(user?.lastSignInAt)} 
          />
          <DetailRow 
            label="Joined on" 
            value={formatDate(user?.createdAt)} 
          />
          <DetailRow 
            label="User ID" 
            value={user?.id || ''} 
          />

          <ProfileSection title="Session details" />
          <DetailRow 
            label="Session ID" 
            value={session?.id || ''} 
          />
          <DetailRow 
            label="Status" 
            value={session?.status || ''} 
          />
          <DetailRow 
            label="Last active" 
            value={formatDateTime(session?.lastActiveAt)} 
          />
          <DetailRow 
            label="Session expiration" 
            value={formatDateTime(session?.expireAt)} 
          />

          {organization && (
            <>
              <ProfileSection title="Organization detail" />
              <DetailRow 
                label="Organization ID" 
                value={organization.id} 
              />
              <DetailRow 
                label="Name" 
                value={organization.name || ''} 
              />
              <DetailRow 
                label="Members" 
                value={organization.membersCount?.toString() || '0'} 
              />
              <DetailRow 
                label="Pending invitations" 
                value={organization.pendingInvitationsCount?.toString() || '0'} 
              />
            </>
          )}
        </View>

        <Pressable 
          style={styles.signOutButton} 
          onPress={async () => await signOut()}
        >
          <Text style={styles.signOutButtonText}>Sign out</Text>
        </Pressable>
      </SignedIn>
      
      <SignedOut>
        <View style={styles.header}>
          <Text style={styles.title}>Clerk + Expo</Text>
          <Text style={styles.subtitle}>Get started by signing in to your account</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Sign in</Text>
            </Pressable>
          </Link>

          <Link href="/(auth)/sign-up" asChild>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Sign up</Text>
            </Pressable>
          </Link>
        </View>
      </SignedOut>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#93C47D', // Green color from the image
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImagePlaceholderText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  detailsContainer: {
    flex: 1,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#6b7280',
    flex: 2,
    textAlign: 'right',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
})