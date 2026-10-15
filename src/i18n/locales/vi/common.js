// Keys shared by at least two areas (units, counts, empty value, week label, common toasts).
export default {
  'common.weeks': p => `${p.n} tuần`,
  'common.people': p => `${p.n} người`,
  'common.members': p => `${p.n} thành viên`,
  'common.artists': p => `${p.n} nghệ sĩ`,
  'common.trainees': p => `${p.n} TTS`,
  'common.yw': p => `N${p.y}·T${p.w}`,
  'common.none': '—',
  'toast.noMoney': 'Không đủ tiền',
  'toast.need': 'Không đủ {m}',
  'fmt.locale': 'vi-VN',
  'common.empty': 'Trống.',
  'common.wkShort': 'T{w}',
  'common.wkYear': 'N{y}',
};
