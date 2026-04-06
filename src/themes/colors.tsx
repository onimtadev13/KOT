const colors = {
  primary:     '#3D013C',
  primaryDeep: '#37073B',
  accent:      '#B54134',
  // accent:      '#FE0000',
  gold:        '#B6A36B',
  goldDark:    '#856431',
  muted:       '#C9BFC8',
  dark:        '#211F20',
  background:  '#F5F3F5',
  card:        '#FFFFFF',
  white:       '#FFFFFF',
  border:      '#EDE8EC',

  text: {
    dark:  '#211F20',
    mid:   '#6B7280',
    muted: '#856431',
    light: '#B0B8C1',
  },

  overlay: {
    gold15:  'rgba(182,163,107,0.15)',
    gold30:  'rgba(182,163,107,0.30)',
    gold45:  'rgba(182,163,107,0.45)',
    white15: 'rgba(255,255,255,0.15)',
    white20: 'rgba(255,255,255,0.20)',
    white12: 'rgba(255,255,255,0.12)',
    muted65: 'rgba(201,191,200,0.65)',
    muted70: 'rgba(201,191,200,0.70)',
    black40: 'rgba(0,0,0,0.4)',
    black50: 'rgba(0,0,0,0.5)',
  },

  disabled: {
    bg:          '#FAFAF9',
    border:      '#EBEBEB',
    icon:        '#C9BFC8',
    badgeBg:     '#F3F1F2',
    badgeBorder: '#E5E1E4',
    badgeText:   '#9C8FA0',
    iconWrapBg:  '#F3F1F2',
  },

  buttons: {
    guest:          { color: '#3D013C', bg: '#F3EEFF' },
    visitor:        { color: '#B54134', bg: '#FEF0EE' },
    executiveStaff: { color: '#856431', bg: '#FDF6E8' },
    pits:           { color: '#37073B', bg: '#EDF0F9' },
    tables:         { color: '#3D013C', bg: '#F5EEF5' },
    qrScan:         { color: '#37073B', bg: '#EEF2FB' },
    vip:            { color: '#856431', bg: '#FDF6E8' },
    add:    '#3D013C',
    order:  '#16A34A',
    return: '#EA580C',
    cancel: '#6B7280',
  },

  docChip: {
    bg:        '#FE0000',
    // labelText: '#B6A36B',
    labelText: '#f0df25',
    // valueText: '#B6A36B',
    valueText: '#ffea01f3',
    shadow:    'transparent',
  },

  shadow: {
    card: 'rgba(33,31,32,0.06)',
  },

  badge: {
    bestSeller: { bg: '#FEF3C7', text: '#92400E' },
    popular:    { bg: '#FEE2E2', text: '#B91C1C' },
    offer:      { bg: '#CCFBF1', text: '#0F766E' },
  },

  // ── CurrentOrderScreen ────────────────────────────────────────────────────
  currentOrder: {
    purple:          '#6C1FC9',
    purpleDeep:      '#3D013C',
    purpleSoft:      '#F3EEFF',
    green:           '#16A34A',
    bg:              '#F5F6FA',
    cardBg:          '#FEF9EE',
    textDark:        '#1A1D2E',
    textMid:         '#292b2f',
    textLight:       '#B0B8C1',
    border:          '#EDF0F4',
    tableHeaderBg:   '#F8F9FC',
    tableRowDivider: '#F3F4F6',
    totalRowBg:      '#FAFBFF',
    approveOffBg:    '#E5E7EB',
    approveOnBg:     '#DCFCE7',
    approveOnBorder: '#BBF7D0',
    approveOffText:  '#374151',
    goBtnDisabled:   '#C4CCDA',
    detail: {
      unit:     '#6C1FC9',
      operator: '#0F766E',
      steward:  '#B45309',
      table:    '#1D4ED8',
      drop:     '#B91C1C',
      points:   '#92400E',
      avgBet:   '#0369A1',
    },
    guest: {
      pits:    { accent: '#0c0d0c', bg: '#FEF3C7' },
      staff:   { accent: '#0F766E', bg: '#CCFBF1' },
      visitor: { accent: '#0369A1', bg: '#E0F2FE' },
      guest:   { accent: '#3D013C', bg: '#F3EEFF' },
    },
    
  },

  // ── PitsCustomerDetailsScreen ─────────────────────────────────────────────
  pitCustomer: {
    purpleDeep:  '#3D013C',
    purple:      '#6C1FC9',
    amber:       '#B45309',
    bg:          '#F5F6FA',
    card:        '#FFFFFF',
    border:      '#EDF0F4',
    textDark:    '#1A1D2E',
    textMid:     '#6B7280',
    textLight:   '#B0B8C1',
    // member ID chip
    memberIdBg:     '#FEF3C7',
    memberIdBorder: '#FDE68A',
    memberIdText:   '#B45309',
    // table badge
    tableBadgeBg:     '#EDE9FE',
    tableBadgeBorder: '#DDD6FE',
    tableBadgeText:   '#3D013C',
    // rating badge
    ratingBg:     '#DC2626',
    ratingShadow: '#DC2626',
    // stat row accent colours
    stat: {
      currentDrop: '#0369A1',
      slotDrop:    '#B45309',
      points:      '#B91C1C',
      avgBet:      '#0F766E',
      actualDrop:  '#1D4ED8',
    },
    // action buttons
    actions: [
      { key: 'SUMMARY',      label: 'Summary',      icon: 'bar-chart-outline',     color: '#6C1FC9', bg: '#F3EEFF' },
      { key: 'PAST_ORDERS',  label: 'Past Orders',  icon: 'time-outline',          color: '#0369A1', bg: '#E0F2FE' },
      { key: 'TABLE',        label: 'Table',        icon: 'easel-outline',         color: '#0F766E', bg: '#CCFBF1' },
      { key: 'SLOT',         label: 'Slot',         icon: 'grid-outline',          color: '#B45309', bg: '#FEF3C7' },
      { key: 'POINTS',       label: 'Points',       icon: 'star-outline',          color: '#B91C1C', bg: '#FEE2E2' },
      { key: 'DROP',         label: 'Drop',         icon: 'trending-down-outline', color: '#1D4ED8', bg: '#DBEAFE' },
      { key: 'PAST_DETAILS', label: 'Past Details', icon: 'document-text-outline', color: '#7C3AED', bg: '#EDE9FE' },
    ],
  },


  // ── PrintSuccessModal ─────────────────────────────────────────────────────
printSuccessModal: {
  overlay:   'rgba(0,0,0,0.55)',
  card:      '#FFFFFF',
  textDark:  '#1A1D2E',
  shadow:    '#000000',
  btnBg:     '#3D013C',
  btnShadow: '#3D013C',
  btnText:   '#FFFFFF',
},

pitsTables: {
  purpleDeep:  '#3D013C',
  amber:       '#B45309',
  amberSoft:   '#FEF3C7',
  bg:          '#F5F6FA',
  card:        '#FFFFFF',
  border:      '#EDF0F4',
  textDark:    '#1A1D2E',
  textMid:     '#6B7280',
  textLight:   '#B0B8C1',
  shadowCard:  '#9CA3AF',
  emptyIconBg: '#F3F4F6',
},

// ── PitsCustomersScreen ───────────────────────────────────────────────────────
pitsCustomers: {
  purpleDeep:      '#3D013C',
  amber:           '#B45309',
  orange:          '#F5830A',
  bg:              '#F5F6FA',
  card:            '#FFFFFF',
  border:          '#EDF0F4',
  textDark:        '#1A1D2E',
  textMid:         '#6B7280',
  textLight:       '#B0B8C1',
  shadowCard:      '#9CA3AF',
  emptyIconBg:     '#F3F4F6',
  // avatar
  avatarBorder:    '#FEF3C7',
  // id chip
  idChipBg:        '#FEF3C7',
  idChipBorder:    '#FDE68A',
  // table strip (commented-out section — kept for future use)
  stripBadgeBorder: 'rgba(255,255,255,0.35)',
  stripSubText:     'rgba(255,255,255,0.85)',
},
 
menu: {
  purpleDeep:        '#3D013C',
  purple:            '#6C1FC9',
  bg:                '#F5F6FA',
  card:              '#FFFFFF',
  border:            '#EDF0F4',
  textDark:          '#1A1D2E',
  textMid:           '#6B7280',
  textLight:         '#B0B8C1',
  shadowCard:        '#9CA3AF',
  emptyIconBg:       '#F3F4F6',
  // thumb fallback
  thumbFallbackBg:   '#F3F4F6',
  thumbFallbackIcon: '#D1D5DB',
  // sold-out item
  soldOutAccent:     '#D1D5DB',
  soldOutBadgeBg:    '#F3F4F6',
  soldOutBadgeText:  '#9CA3AF',
  // dept accent palette (mirrors original DEPT_COLORS array, index 0–6)
  deptColors: [
    { color: '#6C1FC9', bg: '#F3EEFF' },
    { color: '#0369A1', bg: '#E0F2FE' },
    { color: '#0F766E', bg: '#CCFBF1' },
    { color: '#B45309', bg: '#FEF3C7' },
    { color: '#B91C1C', bg: '#FEE2E2' },
    { color: '#1D4ED8', bg: '#DBEAFE' },
    { color: '#7C3AED', bg: '#EDE9FE' },
  ],
},

menuCategories: {
  purpleDeep:        '#3D013C',
  purple:            '#6C1FC9',
  bg:                '#F5F6FA',
  card:              '#FFFFFF',
  border:            '#EDF0F4',
  textDark:          '#1A1D2E',
  textMid:           '#6B7280',
  textLight:         '#B0B8C1',
  shadowCard:        '#9CA3AF',
  emptyIconBg:       '#F3F4F6',
  // thumbnail fallback
  thumbFallbackBg:   '#F3F4F6',
  thumbFallbackIcon: '#D1D5DB',
  // sold-out item
  soldOutAccent:     '#D1D5DB',
  soldOutBadgeBg:    '#F3F4F6',
  soldOutBadgeText:  '#9CA3AF',
  // category accent palette (mirrors original CAT_COLORS array, index 0–6)
  catColors: [
    { color: '#6C1FC9', bg: '#F3EEFF' },
    { color: '#0369A1', bg: '#E0F2FE' },
    { color: '#0F766E', bg: '#CCFBF1' },
    { color: '#B45309', bg: '#FEF3C7' },
    { color: '#B91C1C', bg: '#FEE2E2' },
    { color: '#1D4ED8', bg: '#DBEAFE' },
    { color: '#7C3AED', bg: '#EDE9FE' },
  ],
},

tables: {
  purpleDeep:   '#3D013C',
  purple:       '#6C1FC9',
  bg:           '#F5F6FA',
  textDark:     '#1A1D2E',
  textLight:    '#B0B8C1',
  errorText:    '#EF4444',
  // floor header
  floorInactiveBg:        '#B0B8C1',
  headerIconActiveBg:     'rgba(255,255,255,0.22)',
  headerIconInactiveBg:   'rgba(255,255,255,0.12)',
  headerIconInactiveColor:'rgba(255,255,255,0.7)',
  headerTitleColor:       '#000000',
  headerCellDivider:      'rgba(255,255,255,0.25)',
  headerShadow:           '#000000',
  activeBarColor:         'rgba(255,255,255,0.75)',
  // table button
  tableBtnBg:     '#FFFFFF',
  tableBtnShadow: '#9CA3AF',
  // floor accent palette (index 0–2, mirrors original FLOOR_COLORS array)
  floorColors: ['#6C1FC9', '#0F766E', '#B45309'],
},

visitorDetails: {
  purpleDeep:  '#3D013C',
  blue:        '#0369A1',
  blueSoft:    '#E0F2FE',
  orange:      '#F5830A',
  bg:          '#F5F6FA',
  card:        '#FFFFFF',
  border:      '#EDF0F4',
  textDark:    '#1A1D2E',
  textMid:     '#6B7280',
  textLight:   '#B0B8C1',
  shadowCard:  '#9CA3AF',
  emptyIconBg: '#F3F4F6',
  // input
  inputBg:        '#F9FAFB',
  inputFocusedBg: '#F0F9FF',
  // add button states
  addBtnDisabledBg:   '#BAE6FD',
  addBtnIconDisabled: 'rgba(255,255,255,0.5)',
  addBtnTextDisabled: 'rgba(255,255,255,0.6)',
  // avatar
  avatarBorder: '#BAE6FD',
  // remove button
  removeIcon:        '#EF4444',
  removeBtnBg:       '#FEF2F2',
  removeBtnBorder:   '#FECACA',
  // greet strip (commented-out section — kept for future use)
  greetAvatarBg:     'rgba(255,255,255,0.25)',
  greetAvatarBorder: 'rgba(255,255,255,0.35)',
  greetSubText:      'rgba(255,255,255,0.7)',
  countBadgeBg:      'rgba(255,255,255,0.25)',
  countBadgeBorder:  'rgba(255,255,255,0.4)',
},

pastOrders: {
    purpleDeep:  '#3D013C',
    purple:      '#6C1FC9',
    purpleSoft:  '#F3EEFF',
    purpleBorder:'#DDD6FE',
    amber:       '#B45309',
    amberSoft:   '#FEF3C7',
    teal:        '#0F766E',
    tealSoft:    '#CCFBF1',
    rose:        '#BE123C',
    roseSoft:    '#FFE4E6',
    indigo:      '#4338CA',
    indigoSoft:  '#EEF2FF',
    green:       '#15803D',
    greenSoft:   '#DCFCE7',
    bg:          '#F5F6FA',
    card:        '#FFFFFF',
    border:      '#EDF0F4',
    textDark:    '#1A1D2E',
    textMid:     '#6B7280',
    textLight:   '#B0B8C1',
    shadowCard:  '#3D013C',
    emptyIconBg: '#F3F4F6',
    // field colour schemes
    fields: {
      receipt:  { icon: '#4338CA', iconBg: '#EEF2FF', label: '#4338CA',  value: '#1A1D2E' },
      steward:  { icon: '#B45309', iconBg: '#FEF3C7', label: '#B45309',  value: '#1A1D2E' },
      dateTime: { icon: '#BE123C', iconBg: '#FFE4E6', label: '#BE123C',  value: '#1A1D2E' },
      guestId:  { icon: '#0F766E', iconBg: '#CCFBF1', label: '#0F766E',  value: '#1A1D2E' },
      operator: { icon: '#6C1FC9', iconBg: '#F3EEFF', label: '#6C1FC9',  value: '#1A1D2E' },
    },
  },

};

export default colors;