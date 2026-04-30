const BOOK_DATA = {
  '창':  { num: 1,  name: '창세기' },
  '출':  { num: 2,  name: '출애굽기' },
  '레':  { num: 3,  name: '레위기' },
  '민':  { num: 4,  name: '민수기' },
  '신':  { num: 5,  name: '신명기' },
  '수':  { num: 6,  name: '여호수아' },
  '삿':  { num: 7,  name: '사사기' },
  '룻':  { num: 8,  name: '룻기' },
  '삼상': { num: 9,  name: '사무엘상' },
  '삼하': { num: 10, name: '사무엘하' },
  '왕상': { num: 11, name: '열왕기상' },
  '왕하': { num: 12, name: '열왕기하' },
  '대상': { num: 13, name: '역대상' },
  '대하': { num: 14, name: '역대하' },
  '스':  { num: 15, name: '에스라' },
  '느':  { num: 16, name: '느헤미야' },
  '에':  { num: 17, name: '에스더' },
  '욥':  { num: 18, name: '욥기' },
  '시':  { num: 19, name: '시편' },
  '잠':  { num: 20, name: '잠언' },
  '전':  { num: 21, name: '전도서' },
  '아':  { num: 22, name: '아가' },
  '사':  { num: 23, name: '이사야' },
  '렘':  { num: 24, name: '예레미야' },
  '애':  { num: 25, name: '예레미야애가' },
  '겔':  { num: 26, name: '에스겔' },
  '단':  { num: 27, name: '다니엘' },
  '호':  { num: 28, name: '호세아' },
  '욜':  { num: 29, name: '요엘' },
  '암':  { num: 30, name: '아모스' },
  '옵':  { num: 31, name: '오바댜' },
  '온':  { num: 32, name: '요나' },
  '미':  { num: 33, name: '미가' },
  '나':  { num: 34, name: '나훔' },
  '합':  { num: 35, name: '하박국' },
  '습':  { num: 36, name: '스바냐' },
  '학':  { num: 37, name: '학개' },
  '슥':  { num: 38, name: '스가랴' },
  '말':  { num: 39, name: '말라기' },
  '마':  { num: 40, name: '마태복음' },
  '막':  { num: 41, name: '마가복음' },
  '눅':  { num: 42, name: '누가복음' },
  '요':  { num: 43, name: '요한복음' },
  '행':  { num: 44, name: '사도행전' },
  '롬':  { num: 45, name: '로마서' },
  '고전': { num: 46, name: '고린도전서' },
  '고후': { num: 47, name: '고린도후서' },
  '갈':  { num: 48, name: '갈라디아서' },
  '엡':  { num: 49, name: '에베소서' },
  '빌':  { num: 50, name: '빌립보서' },
  '골':  { num: 51, name: '골로새서' },
  '살전': { num: 52, name: '데살로니가전서' },
  '살후': { num: 53, name: '데살로니가후서' },
  '딤전': { num: 54, name: '디모데전서' },
  '딤후': { num: 55, name: '디모데후서' },
  '딛':  { num: 56, name: '디도서' },
  '몬':  { num: 57, name: '빌레몬서' },
  '히':  { num: 58, name: '히브리서' },
  '약':  { num: 59, name: '야고보서' },
  '벧전': { num: 60, name: '베드로전서' },
  '벧후': { num: 61, name: '베드로후서' },
  '요일': { num: 62, name: '요한일서' },
  '요이': { num: 63, name: '요한이서' },
  '요삼': { num: 64, name: '요한삼서' },
  '유':  { num: 65, name: '유다서' },
  '계':  { num: 66, name: '요한계시록' },
};

export function parsePassage(passageStr) {
  const segments = passageStr.split(', ');
  const chapters = [];

  for (const seg of segments) {
    const trimmed = seg.trim();
    // Matches: "창 1-6", "창 1", "고전 1-3", "요이 1", etc.
    const match = trimmed.match(/^(\S+)\s+(\d+)(?:-(\d+))?$/);
    if (!match) continue;

    const [, abbr, startStr, endStr] = match;
    const book = BOOK_DATA[abbr];
    if (!book) continue;

    const startCh = parseInt(startStr);
    const endCh = endStr ? parseInt(endStr) : startCh;

    for (let ch = startCh; ch <= endCh; ch++) {
      chapters.push({ bookNum: book.num, bookName: book.name, chapter: ch });
    }
  }

  return chapters;
}
