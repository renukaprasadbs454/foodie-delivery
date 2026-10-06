import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/features/auth/authSlice';
import { useGetDeliveryProfileQuery } from '@/api/endpoints/deliveryApi';
import {
  useGetSupportTicketsQuery,
  useGetTicketMessagesQuery,
  useCreateSupportTicketMutation,
  useSendTicketMessageMutation,
  type SupportConversationDto,
  type SupportMessageDto,
} from '@/api/endpoints/supportApi';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'HelpAndSupport'>;

const THEME_PRIMARY = '#14532D';
const THEME_DARK = '#0F3E22';
const THEME_ACCENT = '#F59E0B';
const THEME_BG = '#F8FAFC';
const THEME_CARD = '#FFFFFF';
const THEME_TEXT_MAIN = '#0F172A';
const THEME_TEXT_MUTED = '#64748B';
const THEME_BORDER = '#E2E8F0';

const CATEGORIES = [
  { id: 'Payout & Incentives', label: 'Payout & Incentives', icon: 'dollar-sign' as const },
  { id: 'Order & Delivery', label: 'Order & Delivery', icon: 'package' as const },
  { id: 'Account & KYC', label: 'Account & KYC', icon: 'user-check' as const },
  { id: 'App & GPS', label: 'App & GPS Technical', icon: 'map-pin' as const },
  { id: 'General Query', label: 'General Query', icon: 'help-circle' as const },
];

function getStatusBadge(status: string) {
  const normalized = (status || 'OPEN').toUpperCase();
  if (normalized === 'RESOLVED' || normalized === 'CLOSED') {
    return {
      label: 'Resolved',
      bg: '#DCFCE7',
      text: '#15803D',
      border: '#86EFAC',
      icon: 'check-circle' as const,
    };
  }
  if (normalized === 'AGENT_ACTIVE' || normalized === 'IN_PROGRESS' || normalized === 'ASSIGNED') {
    return {
      label: 'Agent Responded',
      bg: '#DBEAFE',
      text: '#1D4ED8',
      border: '#93C5FD',
      icon: 'message-circle' as const,
    };
  }
  return {
    label: 'Open / Pending',
    bg: '#FEF3C7',
    text: '#B45309',
    border: '#FCD34D',
    icon: 'clock' as const,
  };
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Just now';
  }
}

/** Component to render full chat thread for an expanded ticket */
function TicketThreadView({
  ticketId,
  partnerName,
}: {
  ticketId: string;
  partnerName: string;
}) {
  const { data: messages, isLoading, refetch } = useGetTicketMessagesQuery(ticketId, {
    pollingInterval: 5000,
  });
  const [sendReply, { isLoading: isSending }] = useSendTicketMessageMutation();
  const [replyText, setReplyText] = useState('');

  const handleSend = async () => {
    const trimmed = replyText.trim();
    if (!trimmed || isSending) return;
    try {
      await sendReply({
        ticketId,
        message: trimmed,
        senderName: partnerName || 'Delivery Partner',
      }).unwrap();
      setReplyText('');
      void refetch();
    } catch {
      // Handled by UI
    }
  };

  if (isLoading) {
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={THEME_PRIMARY} />
        <Text style={{ fontSize: 12, color: THEME_TEXT_MUTED, marginTop: 8 }}>
          Loading conversation...
        </Text>
      </View>
    );
  }

  const messageList = messages || [];

  return (
    <View style={styles.threadContainer}>
      <View style={styles.threadHeader}>
        <Text style={styles.threadTitle}>Conversation History</Text>
        <Pressable onPress={() => void refetch()} style={{ padding: 4 }}>
          <Feather name="refresh-cw" size={14} color={THEME_TEXT_MUTED} />
        </Pressable>
      </View>

      {messageList.length === 0 ? (
        <Text style={{ fontSize: 13, color: THEME_TEXT_MUTED, fontStyle: 'italic', marginVertical: 8 }}>
          No messages recorded yet.
        </Text>
      ) : (
        <View style={{ gap: 10, marginVertical: 8 }}>
          {messageList.map((m: SupportMessageDto) => {
            const isAgent =
              m.senderType === 'AGENT' ||
              (m.senderName && m.senderName.toLowerCase().includes('admin'));

            return (
              <View
                key={m.id}
                style={[
                  styles.messageBubble,
                  isAgent ? styles.messageAgent : styles.messagePartner,
                ]}
              >
                <View style={styles.messageHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Feather
                      name={isAgent ? 'shield' : 'user'}
                      size={12}
                      color={isAgent ? '#1D4ED8' : THEME_PRIMARY}
                    />
                    <Text
                      style={[
                        styles.messageSender,
                        { color: isAgent ? '#1D4ED8' : THEME_PRIMARY },
                      ]}
                    >
                      {isAgent ? 'Admin Support' : 'You'}
                    </Text>
                  </View>
                  <Text style={styles.messageTime}>{formatDate(m.createdAt)}</Text>
                </View>
                <Text style={styles.messageContent}>{m.content}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Reply input */}
      <View style={styles.replyBox}>
        <TextInput
          style={styles.replyInput}
          placeholder="Send a follow-up reply..."
          placeholderTextColor="#94A3B8"
          value={replyText}
          onChangeText={setReplyText}
          multiline
        />
        <Pressable
          style={[styles.replySendBtn, (!replyText.trim() || isSending) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!replyText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="send" size={16} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export function HelpAndSupportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isConnected } = useConnectivity();
  const userId = useAppSelector(selectUserId);
  const profileQuery = useGetDeliveryProfileQuery();
  const partnerName = profileQuery.data?.fullName || 'Delivery Partner';

  const [activeTab, setActiveTab] = useState<'raise' | 'history'>('raise');

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0].id);
  const [subject, setSubject] = useState('');
  const [orderId, setOrderId] = useState('');
  const [description, setDescription] = useState('');
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);

  // Success State
  const [submittedTicket, setSubmittedTicket] = useState<SupportConversationDto | null>(null);

  // Expanded Ticket in History
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // API hooks
  const {
    data: allTickets,
    isLoading: isTicketsLoading,
    refetch: refetchTickets,
  } = useGetSupportTicketsQuery(undefined, { pollingInterval: 10000 });
  const [createTicket, { isLoading: isSubmitting }] = useCreateSupportTicketMutation();

  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  // Filter tickets to show delivery tickets
  const deliveryTickets = useMemo(() => {
    if (!allTickets) return [];
    return allTickets.filter(
      (t) =>
        t.category === 'DELIVERY' ||
        (t.customerId && userId && t.customerId === userId) ||
        (t.subject && t.subject.includes('[Payout') || t.subject.includes('[Order') || t.subject.includes('[Delivery'))
    );
  }, [allTickets, userId]);

  const handleSubmit = async () => {
    setSubjectError(null);
    setDescError(null);

    if (!isConnected) {
      setToast({ message: 'You are offline. Connect to submit a complaint.', variant: 'error' });
      return;
    }

    let hasError = false;
    if (!subject.trim() || subject.trim().length < 4) {
      setSubjectError('Please provide a descriptive subject (at least 4 characters).');
      hasError = true;
    }

    if (!description.trim() || description.trim().length < 10) {
      setDescError('Please explain the issue in detail (at least 10 characters).');
      hasError = true;
    }

    if (hasError) return;

    try {
      const res = await createTicket({
        category: selectedCategory,
        subject: subject.trim(),
        description: description.trim(),
        orderId: orderId.trim() || undefined,
        senderName: `${partnerName} (Delivery Fleet)`,
      }).unwrap();

      setSubmittedTicket(res);
      setSubject('');
      setOrderId('');
      setDescription('');
      setToast({
        message: `Complaint ticket ${res.id} raised successfully!`,
        variant: 'success',
      });
      void refetchTickets();
    } catch (err: any) {
      setToast({
        message: err?.data?.message || err?.message || 'Failed to submit complaint. Try again.',
        variant: 'error',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: THEME_BG }}
    >
      {/* Top Header */}
      <LinearGradient
        colors={[THEME_DARK, THEME_PRIMARY, '#1B6A3A']}
        style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Help & Support</Text>
            <Text style={styles.headerSubtitle}>Foodie Delivery Partner Desk</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === 'raise' && styles.tabButtonActive]}
            onPress={() => setActiveTab('raise')}
          >
            <Feather
              name="plus-circle"
              size={15}
              color={activeTab === 'raise' ? THEME_PRIMARY : '#E2E8F0'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'raise' && styles.tabButtonTextActive]}
            >
              Raise Complaint
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('history');
              void refetchTickets();
            }}
          >
            <Feather
              name="clock"
              size={15}
              color={activeTab === 'history' ? THEME_PRIMARY : '#E2E8F0'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}
            >
              My Complaints {deliveryTickets.length > 0 ? `(${deliveryTickets.length})` : ''}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'raise' ? (
          <View>
            {/* Success Card if just submitted */}
            {submittedTicket && (
              <View style={styles.successBanner}>
                <View style={styles.successIconCircle}>
                  <Feather name="check" size={22} color="#15803D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>Complaint Submitted!</Text>
                  <Text style={styles.successSub}>
                    Your ticket reference ID is{' '}
                    <Text style={{ fontWeight: '800', color: '#15803D' }}>{submittedTicket.id}</Text>
                    . Our support desk has received your issue.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <Pressable
                      style={styles.successActionBtn}
                      onPress={() => {
                        setExpandedTicketId(submittedTicket.id);
                        setActiveTab('history');
                      }}
                    >
                      <Text style={styles.successActionBtnText}>View in My Complaints</Text>
                    </Pressable>
                    <Pressable
                      style={styles.successDismissBtn}
                      onPress={() => setSubmittedTicket(null)}
                    >
                      <Text style={styles.successDismissBtnText}>Dismiss</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Form Card */}
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <View style={styles.formHeaderIconBg}>
                  <Feather name="alert-circle" size={18} color={THEME_PRIMARY} />
                </View>
                <View>
                  <Text style={styles.formTitle}>Submit a Complaint</Text>
                  <Text style={styles.formSubtitle}>
                    Select an issue category and describe your problem
                  </Text>
                </View>
              </View>

              {/* 1. Category Selector */}
              <Text style={styles.fieldLabel}>ISSUE CATEGORY *</Text>
              <View style={styles.categoryChipsContainer}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Feather
                        name={cat.icon}
                        size={14}
                        color={isSelected ? '#FFFFFF' : THEME_PRIMARY}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* 2. Subject Input */}
              <Text style={styles.fieldLabel}>SUBJECT *</Text>
              <TextInput
                style={[styles.input, subjectError && styles.inputError]}
                placeholder="e.g. Rain surge incentive not credited"
                placeholderTextColor="#94A3B8"
                value={subject}
                onChangeText={(text) => {
                  setSubject(text);
                  if (subjectError) setSubjectError(null);
                }}
              />
              {subjectError && <Text style={styles.errorText}>{subjectError}</Text>}

              {/* 3. Order ID Input (Optional) */}
              <Text style={styles.fieldLabel}>ORDER / ASSIGNMENT ID (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ORD-9821 or leave blank if general"
                placeholderTextColor="#94A3B8"
                value={orderId}
                onChangeText={setOrderId}
                autoCapitalize="characters"
              />

              {/* 4. Description Input */}
              <Text style={styles.fieldLabel}>DESCRIPTION & DETAILS *</Text>
              <TextInput
                style={[styles.input, styles.textArea, descError && styles.inputError]}
                placeholder="Describe your issue with exact timings, order numbers, or payout discrepancies so our team can resolve it immediately..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (descError) setDescError(null);
                }}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              {descError && <Text style={styles.errorText}>{descError}</Text>}

              {/* Submit Button */}
              <Pressable
                style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Submit Complaint</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Quick Tips Box */}
            <View style={styles.tipsBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                <Feather name="info" size={16} color="#0369A1" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0369A1' }}>
                  Support Resolution SLA
                </Text>
              </View>
              <Text style={styles.tipsText}>
                • Payout & incentive tickets are audited and credited within 24 business hours.
              </Text>
              <Text style={styles.tipsText}>
                • Live assignment emergencies are escalated to our 24/7 dispatch supervisor.
              </Text>
              <Text style={styles.tipsText}>
                • You will receive direct message replies from support agents in the &quot;My Complaints&quot; tab.
              </Text>
            </View>
          </View>
        ) : (
          <View>
            {/* My Complaints List */}
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historySectionTitle}>Your Submitted Tickets</Text>
              <Pressable
                style={styles.refreshIconBtn}
                onPress={() => void refetchTickets()}
                accessibilityLabel="Refresh tickets"
              >
                <Feather name="rotate-cw" size={16} color={THEME_PRIMARY} />
              </Pressable>
            </View>

            {isTicketsLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME_PRIMARY} />
                <Text style={{ marginTop: 12, fontSize: 14, color: THEME_TEXT_MUTED }}>
                  Fetching support tickets...
                </Text>
              </View>
            ) : deliveryTickets.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyStateIconBg}>
                  <Feather name="inbox" size={32} color="#94A3B8" />
                </View>
                <Text style={styles.emptyStateTitle}>No Complaints Raised</Text>
                <Text style={styles.emptyStateText}>
                  You haven&apos;t submitted any support complaints yet. If you have questions regarding
                  payouts, assignments, or app issues, tap &quot;Raise Complaint&quot; above.
                </Text>
                <Pressable
                  style={styles.emptyStateBtn}
                  onPress={() => setActiveTab('raise')}
                >
                  <Feather name="plus-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyStateBtnText}>Raise a Complaint</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                {deliveryTickets.map((ticket: SupportConversationDto) => {
                  const badge = getStatusBadge(ticket.status);
                  const isExpanded = expandedTicketId === ticket.id;

                  return (
                    <View key={ticket.id} style={styles.ticketCard}>
                      <Pressable
                        style={styles.ticketCardHeader}
                        onPress={() =>
                          setExpandedTicketId(isExpanded ? null : ticket.id)
                        }
                      >
                        <View style={{ flex: 1 }}>
                          <View style={styles.ticketMetaRow}>
                            <View style={styles.ticketIdBadge}>
                              <Text style={styles.ticketIdText}>{ticket.id}</Text>
                            </View>
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: badge.bg, borderColor: badge.border },
                              ]}
                            >
                              <Feather name={badge.icon} size={11} color={badge.text} />
                              <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                                {badge.label}
                              </Text>
                            </View>
                            {ticket.orderId ? (
                              <View style={styles.orderIdBadge}>
                                <Text style={styles.orderIdText}>{ticket.orderId}</Text>
                              </View>
                            ) : null}
                          </View>

                          <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                          <Text style={styles.ticketDate}>
                            Created {formatDate(ticket.createdAt)}
                            {ticket.lastMessageAt && ticket.lastMessageAt !== ticket.createdAt
                              ? ` • Updated ${formatDate(ticket.lastMessageAt)}`
                              : ''}
                          </Text>
                        </View>

                        <View style={styles.ticketChevronContainer}>
                          <Feather
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="#94A3B8"
                          />
                        </View>
                      </Pressable>

                      {/* Expanded View with Messages Thread */}
                      {isExpanded && (
                        <View style={styles.ticketExpandedContent}>
                          <View style={styles.divider} />
                          <TicketThreadView
                            ticketId={ticket.id}
                            partnerName={partnerName}
                          />
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          visible={Boolean(toast)}
          variant={toast.variant}
          accessibilityLabel={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  tabButtonTextActive: {
    color: THEME_PRIMARY,
    fontWeight: '700',
  },
  contentContainer: {
    padding: 16,
  },
  formCard: {
    backgroundColor: THEME_CARD,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME_BORDER,
  },
  formHeaderIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME_TEXT_MAIN,
  },
  formSubtitle: {
    fontSize: 12,
    color: THEME_TEXT_MUTED,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  categoryChipSelected: {
    backgroundColor: THEME_PRIMARY,
    borderColor: THEME_PRIMARY,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME_TEXT_MAIN,
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME_TEXT_MAIN,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME_PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    shadowColor: THEME_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  successIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },
  successSub: {
    fontSize: 13,
    color: '#166534',
    marginTop: 3,
    lineHeight: 18,
  },
  successActionBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  successActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successDismissBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  successDismissBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tipsBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 14,
  },
  tipsText: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 18,
    marginBottom: 4,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME_TEXT_MAIN,
  },
  refreshIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateCard: {
    backgroundColor: THEME_CARD,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME_BORDER,
  },
  emptyStateIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME_TEXT_MAIN,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    color: THEME_TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyStateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ticketCard: {
    backgroundColor: THEME_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME_BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    justifyContent: 'space-between',
  },
  ticketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  ticketIdBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ticketIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderIdBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderIdText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME_TEXT_MAIN,
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 11,
    color: THEME_TEXT_MUTED,
  },
  ticketChevronContainer: {
    paddingLeft: 8,
  },
  ticketExpandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME_BORDER,
    marginBottom: 12,
  },
  threadContainer: {
    gap: 8,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    maxWidth: '92%',
  },
  messagePartner: {
    backgroundColor: '#F0FDF4',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  messageAgent: {
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  messageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 11,
    fontWeight: '700',
  },
  messageTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  messageContent: {
    fontSize: 13,
    color: THEME_TEXT_MAIN,
    lineHeight: 18,
  },
  replyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 80,
    fontSize: 13,
    color: THEME_TEXT_MAIN,
    paddingVertical: 4,
  },
  replySendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
