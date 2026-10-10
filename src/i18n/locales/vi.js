// Locale chuẩn: mọi locale khác phải có đúng bộ key này.
export default {
  meta: { code: 'vi', name: 'Tiếng Việt', htmlLang: 'vi' },
  dict: {
    'lang.title': 'Ngôn ngữ',
    'lang.current': 'Đang dùng: {name}',
    'top.fund': 'Quỹ công ty',
    'top.save': 'Lưu / chuyển game',
    'top.events': 'Sự kiện',
    'top.help': 'Hướng dẫn',
    'top.week': 'Tuần',
    'top.year': 'Năm {n}',
    'top.next': 'Kết thúc tuần {n}',
    'top.fans': '💗 {n} fan',
    'top.artists': p => `${p.n} nghệ sĩ`,
    'top.roof': p => `${p.g} nhóm · ${p.s} solo · ${p.a} diễn viên`,
    'dock.aria': 'Phòng ban',
    'log.title': 'Nhật ký công ty',
    'saved.ok': '💾 Đã lưu tự động',
    'saved.fail': '⚠️ Không lưu được',
    'fmt.units': { b: ' tỷ', m: ' tr', k: 'k' },
  },
};
