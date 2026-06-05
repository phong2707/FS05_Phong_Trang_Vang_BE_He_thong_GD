import models from "@models";

async function seedQuestions() {
  console.log("🚀 Bắt đầu quá trình seed Câu hỏi...");

  // 1. Tìm Giáo viên (Teacher)
  const teacher = await models.user.findFirst({
    where: {
      roles: {
        some: { role: { code: "TEACHER" } }
      }
    }
  });

  if (!teacher) {
    throw new Error("Thiếu teacher trong Database. Vui lòng chạy file seed.ts tổng trước.");
  }
  const teacherId = teacher.id;

  // 2. Tìm hoặc tạo loại câu hỏi Trắc nghiệm
  let mcqType = await models.questionType.findFirst({
    where: { name: "Trắc nghiệm một đáp án" }
  });
  if (!mcqType) {
    console.log("🛠️ Chưa có loại câu hỏi trắc nghiệm, đang tạo mới...");
    mcqType = await models.questionType.create({
      data: { name: "Trắc nghiệm một đáp án" }
    });
  }
  const typeId = mcqType.id;

  // 3. Tìm hoặc tạo loại câu hỏi Tự luận
  let essayType = await models.questionType.findFirst({
    where: { name: "Tự luận / Upload Code" }
  });
  if (!essayType) {
    console.log("🛠️ Chưa có loại câu hỏi tự luận, đang tạo mới...");
    essayType = await models.questionType.create({
      data: { name: "Tự luận / Upload Code", description: "Đòi hỏi sinh viên nhập text hoặc nộp link" }
    });
  }

  // ==========================================
  // PHẦN 1: TẠO CÂU HỎI TRẮC NGHIỆM (90 Câu)
  // (Đổ dồn vào Chapter đầu tiên tìm thấy)
  // ==========================================
  const firstChapter = await models.chapter.findFirst({ include: { subject: true } });
  
  if (firstChapter && firstChapter.subject) {
    console.log(`🔥 Seeding MCQs (Trắc nghiệm) vào chương: ${firstChapter.title}...`);
    
    const chapterId = firstChapter.id;
    const subjectId = firstChapter.subject.id;
    const courseId = firstChapter.subject.courseId;

    const createQ = async (
      content: string,
      answers: { text: string; correct: boolean }[],
      difficulty: "EASY" | "MEDIUM" | "HARD"
    ) => {
      return models.question.create({
        data: {
          scope: "CHAPTER", chapterId, subjectId, courseId, teacherId, typeId,
          questionFormat: "SINGLE_CHOICE", content, difficulty,
          answers: {
            create: answers.map((a, i) => ({ answerText: a.text, isCorrect: a.correct, orderIndex: i + 1 })),
          },
        },
      });
    };

    // --- EASY (Lấy 1 vài câu tượng trưng, giữ nguyên logic của bạn) ---
    await createQ("Câu lệnh nào thuộc DML?", [{ text: "CREATE", correct: false }, { text: "DROP", correct: false }, { text: "SELECT", correct: true }, { text: "ALTER", correct: false }], "EASY");
    await createQ("Kiểu dữ liệu nào dùng cho chuỗi?", [{ text: "INT", correct: false }, { text: "DATE", correct: false }, { text: "VARCHAR", correct: true }, { text: "FLOAT", correct: false }], "EASY");
    await createQ("Node.js sử dụng mô hình gì?", [{ text: "Blocking", correct: false }, { text: "Multi-thread sync", correct: false }, { text: "Event-driven non-blocking", correct: true }, { text: "OOP only", correct: false }], "EASY");
    await createQ("Module nào dùng để làm việc với file?", [{ text: "http", correct: false }, { text: "fs", correct: true }, { text: "path", correct: false }, { text: "url", correct: false }], "EASY");
    await createQ("Câu lệnh nào dùng để tạo bảng?", [{ text: "INSERT", correct: false }, { text: "CREATE TABLE", correct: true }, { text: "SELECT", correct: false }, { text: "UPDATE", correct: false }], "EASY");
    await createQ("ALTER TABLE dùng để?", [{ text: "Xóa bảng", correct: false }, { text: "Sửa cấu trúc bảng", correct: true }, { text: "Thêm dữ liệu", correct: false }, { text: "Lấy dữ liệu", correct: false }], "EASY");
    await createQ("DROP TABLE dùng để?", [{ text: "Xóa bảng", correct: true }, { text: "Tạo bảng", correct: false }, { text: "Sửa bảng", correct: false }, { text: "Thêm dữ liệu", correct: false }], "EASY");
    await createQ("INT dùng để lưu?", [{ text: "Chuỗi", correct: false }, { text: "Số nguyên", correct: true }, { text: "Ngày", correct: false }, { text: "Boolean", correct: false }], "EASY");
    await createQ("BOOLEAN có giá trị?", [{ text: "0/1 hoặc true/false", correct: true }, { text: "Chuỗi", correct: false }, { text: "Số thực", correct: false }, { text: "NULL", correct: false }], "EASY");
    await createQ("NULL nghĩa là?", [{ text: "0", correct: false }, { text: "Rỗng/không có giá trị", correct: true }, { text: "False", correct: false }, { text: "Undefined", correct: false }], "EASY");
    await createQ("DEFAULT dùng để?", [{ text: "Xóa dữ liệu", correct: false }, { text: "Giá trị mặc định", correct: true }, { text: "Lọc", correct: false }, { text: "Join", correct: false }], "EASY");
    await createQ("FOREIGN KEY dùng để?", [{ text: "Tạo khóa chính", correct: false }, { text: "Liên kết bảng", correct: true }, { text: "Xóa bảng", correct: false }, { text: "Tạo index", correct: false }], "EASY");
    await createQ("AUTO_INCREMENT dùng để?", [{ text: "Tăng tự động", correct: true }, { text: "Giảm", correct: false }, { text: "Xóa", correct: false }, { text: "Lọc", correct: false }], "EASY");
    await createQ("INDEX dùng để?", [{ text: "Tăng tốc truy vấn", correct: true }, { text: "Xóa dữ liệu", correct: false }, { text: "Tạo bảng", correct: false }, { text: "Join", correct: false }], "EASY");
    await createQ("HTTP là viết tắt của?", [{ text: "Hyper Text Transfer Protocol", correct: true }, { text: "High Transfer Text Protocol", correct: false }, { text: "Hyper Tool Transfer Protocol", correct: false }, { text: "None", correct: false }], "EASY");
    await createQ("HTTPS khác HTTP ở?", [{ text: "Nhanh hơn", correct: false }, { text: "Bảo mật (SSL/TLS)", correct: true }, { text: "Không dùng port", correct: false }, { text: "Không gửi data", correct: false }], "EASY");
    await createQ("Status code 500 nghĩa là?", [{ text: "OK", correct: false }, { text: "Not Found", correct: false }, { text: "Server Error", correct: true }, { text: "Redirect", correct: false }], "EASY");
    await createQ("Status code 301 nghĩa là?", [{ text: "Lỗi", correct: false }, { text: "Redirect", correct: true }, { text: "Thành công", correct: false }, { text: "Không tìm thấy", correct: false }], "EASY");
    await createQ("Node.js là?", [{ text: "Framework", correct: false }, { text: "Runtime", correct: true }, { text: "Database", correct: false }, { text: "OS", correct: false }], "EASY");
    await createQ("npm là gì?", [{ text: "Database", correct: false }, { text: "Package manager", correct: true }, { text: "Compiler", correct: false }, { text: "Framework", correct: false }], "EASY");
    await createQ("package.json chứa?", [{ text: "Code", correct: false }, { text: "Cấu hình project", correct: true }, { text: "Database", correct: false }, { text: "UI", correct: false }], "EASY");
    await createQ("require() và import dùng để?", [{ text: "Chạy code", correct: false }, { text: "Import module", correct: true }, { text: "Debug", correct: false }, { text: "Xóa file", correct: false }], "EASY");
    await createQ("module.exports dùng để?", [{ text: "Import", correct: false }, { text: "Export", correct: true }, { text: "Run", correct: false }, { text: "Debug", correct: false }], "EASY");
    await createQ("fs.readFile dùng để?", [{ text: "Ghi file", correct: false }, { text: "Đọc file", correct: true }, { text: "Xóa file", correct: false }, { text: "Tạo server", correct: false }], "EASY");
    await createQ("fs.writeFile dùng để?", [{ text: "Đọc file", correct: false }, { text: "Ghi file", correct: true }, { text: "Xóa file", correct: false }, { text: "Join", correct: false }], "EASY");
    await createQ("path.join dùng để?", [{ text: "Join bảng", correct: false }, { text: "Ghép đường dẫn", correct: true }, { text: "Gửi request", correct: false }, { text: "Xóa file", correct: false }], "EASY");
    await createQ("__dirname là?", [{ text: "Tên file", correct: false }, { text: "Thư mục hiện tại", correct: true }, { text: "URL", correct: false }, { text: "Port", correct: false }], "EASY");
    await createQ("Express route là?", [{ text: "Database", correct: false }, { text: "Đường dẫn API", correct: true }, { text: "File", correct: false }, { text: "Module", correct: false }], "EASY");
    await createQ("app.get dùng để?", [{ text: "POST", correct: false }, { text: "GET request", correct: true }, { text: "DELETE", correct: false }, { text: "PUT", correct: false }], "EASY");
    await createQ("app.post dùng để?", [{ text: "Lấy dữ liệu", correct: false }, { text: "Gửi dữ liệu", correct: true }, { text: "Xóa", correct: false }, { text: "Sửa", correct: false }], "EASY");
    await createQ("app.put dùng để?", [{ text: "Tạo mới", correct: false }, { text: "Cập nhật", correct: true }, { text: "Xóa", correct: false }, { text: "Lấy", correct: false }], "EASY");
    await createQ("app.delete dùng để?", [{ text: "Xóa", correct: true }, { text: "Tạo", correct: false }, { text: "Sửa", correct: false }, { text: "Lấy", correct: false }], "EASY");
    await createQ("res.json() dùng để?", [{ text: "Gửi HTML", correct: false }, { text: "Gửi JSON", correct: true }, { text: "Gửi file", correct: false }, { text: "Redirect", correct: false }], "EASY");
    await createQ("next() trong middleware dùng để?", [{ text: "Kết thúc", correct: false }, { text: "Chuyển sang middleware tiếp", correct: true }, { text: "Gửi response", correct: false }, { text: "Debug", correct: false }], "EASY");
    await createQ("Router trong Express dùng để?", [{ text: "DB", correct: false }, { text: "Tổ chức route", correct: true }, { text: "File", correct: false }, { text: "API call", correct: false }], "EASY");
    await createQ("CORS là gì?", [{ text: "Database", correct: false }, { text: "Cơ chế bảo mật request", correct: true }, { text: "Framework", correct: false }, { text: "API", correct: false }], "EASY");
    await createQ("JSON.parse dùng để?", [{ text: "Object → JSON", correct: false }, { text: "JSON → Object", correct: true }, { text: "Debug", correct: false }, { text: "String", correct: false }], "EASY");
    await createQ("JSON.stringify dùng để?", [{ text: "JSON → Object", correct: false }, { text: "Object → JSON", correct: true }, { text: "Delete", correct: false }, { text: "Filter", correct: false }], "EASY");
    await createQ("Promise là gì?", [{ text: "Biến", correct: false }, { text: "Đối tượng async", correct: true }, { text: "Hàm sync", correct: false }, { text: "DB", correct: false }], "EASY");
    await createQ("async/await dùng để?", [{ text: "Đồng bộ", correct: false }, { text: "Bất đồng bộ dễ đọc", correct: true }, { text: "Debug", correct: false }, { text: "Loop", correct: false }], "EASY");
    await createQ("try/catch dùng để?", [{ text: "Loop", correct: false }, { text: "Bắt lỗi", correct: true }, { text: "Join", correct: false }, { text: "Sort", correct: false }], "EASY");
    await createQ("throw dùng để?", [{ text: "Tạo lỗi", correct: true }, { text: "Xóa lỗi", correct: false }, { text: "Fix lỗi", correct: false }, { text: "Debug", correct: false }], "EASY");
    await createQ("Callback là?", [{ text: "Hàm gọi lại", correct: true }, { text: "Loop", correct: false }, { text: "DB", correct: false }, { text: "JSON", correct: false }], "EASY");
    await createQ("Event là?", [{ text: "Database", correct: false }, { text: "Sự kiện", correct: true }, { text: "File", correct: false }, { text: "API", correct: false }], "EASY");
    await createQ("Sequelize hỗ trợ DB nào?", [{ text: "MySQL", correct: false }, { text: "PostgreSQL", correct: false }, { text: "SQLite", correct: false }, { text: "Tất cả", correct: true }], "EASY");

    // --- MEDIUM ---
    await createQ("Câu nào đúng để lấy cột name từ bảng users?", [{ text: "SELECT users", correct: false }, { text: "SELECT name FROM users", correct: true }, { text: "GET name users", correct: false }, { text: "SELECT * name users", correct: false }], "MEDIUM");
    await createQ("Toán tử nào dùng để lọc dữ liệu bằng nhau?", [{ text: "==", correct: false }, { text: "=", correct: true }, { text: "===", correct: false }, { text: "!=", correct: false }], "MEDIUM");
    await createQ("DISTINCT dùng để?", [{ text: "Sắp xếp", correct: false }, { text: "Lọc trùng", correct: true }, { text: "Join bảng", correct: false }, { text: "Tính tổng", correct: false }], "MEDIUM");
    await createQ("ORDER BY dùng để?", [{ text: "Lọc dữ liệu", correct: false }, { text: "Nhóm dữ liệu", correct: false }, { text: "Sắp xếp", correct: true }, { text: "Xóa dữ liệu", correct: false }], "MEDIUM");
    await createQ("WHERE chạy ở bước nào?", [{ text: "Sau SELECT", correct: false }, { text: "Sau ORDER BY", correct: false }, { text: "Sau FROM", correct: true }, { text: "Sau HAVING", correct: false }], "MEDIUM");
    await createQ("IN dùng để?", [{ text: "So sánh nhiều giá trị", correct: true }, { text: "Cộng số", correct: false }, { text: "Join bảng", correct: false }, { text: "Sắp xếp", correct: false }], "MEDIUM");
    await createQ("BETWEEN dùng để?", [{ text: "So sánh chuỗi", correct: false }, { text: "Lọc khoảng giá trị", correct: true }, { text: "Join bảng", correct: false }, { text: "Tính toán", correct: false }], "MEDIUM");
    await createQ("LIKE '%abc%' nghĩa là gì?", [{ text: "Bắt đầu abc", correct: false }, { text: "Kết thúc abc", correct: false }, { text: "Chứa abc", correct: true }, { text: "Bằng abc", correct: false }], "MEDIUM");
    await createQ("db.get() dùng để?", [{ text: "Lấy nhiều dòng", correct: false }, { text: "Lấy 1 dòng", correct: true }, { text: "Insert", correct: false }, { text: "Delete", correct: false }], "MEDIUM");
    await createQ("req.params dùng để?", [{ text: "Lấy query", correct: false }, { text: "Lấy body", correct: false }, { text: "Lấy param URL", correct: true }, { text: "Lấy header", correct: false }], "MEDIUM");
    await createQ("Tạo record mới dùng?", [{ text: "findAll", correct: false }, { text: "create", correct: true }, { text: "update", correct: false }, { text: "destroy", correct: false }], "MEDIUM");
    await createQ("Lấy tất cả dữ liệu?", [{ text: "findOne", correct: false }, { text: "findAll", correct: true }, { text: "findByPk", correct: false }, { text: "create", correct: false }], "MEDIUM");
    await createQ("Lấy theo id?", [{ text: "findAll", correct: false }, { text: "findByPk", correct: true }, { text: "findOneAll", correct: false }, { text: "get", correct: false }], "MEDIUM");
    await createQ("Cập nhật dữ liệu dùng?", [{ text: "create", correct: false }, { text: "update", correct: true }, { text: "delete", correct: false }, { text: "find", correct: false }], "MEDIUM");
    await createQ("Xóa dữ liệu dùng?", [{ text: "remove", correct: false }, { text: "delete", correct: false }, { text: "destroy", correct: true }, { text: "drop", correct: false }], "MEDIUM");
    await createQ("where dùng để?", [{ text: "Join", correct: false }, { text: "Lọc dữ liệu", correct: true }, { text: "Insert", correct: false }, { text: "Sync", correct: false }], "MEDIUM");
    await createQ("Op.gt nghĩa là?", [{ text: "<", correct: false }, { text: ">", correct: true }, { text: "=", correct: false }, { text: "!=", correct: false }], "MEDIUM");
    await createQ("Op.like dùng để?", [{ text: "So sánh số", correct: false }, { text: "So sánh chuỗi", correct: true }, { text: "Join", correct: false }, { text: "Insert", correct: false }], "MEDIUM");
    await createQ("attributes dùng để?", [{ text: "Chọn cột", correct: true }, { text: "Join", correct: false }, { text: "Delete", correct: false }, { text: "Insert", correct: false }], "MEDIUM");
    await createQ("order dùng để?", [{ text: "Sort", correct: true }, { text: "Join", correct: false }, { text: "Delete", correct: false }, { text: "Filter", correct: false }], "MEDIUM");
    await createQ("limit dùng để?", [{ text: "Lọc", correct: false }, { text: "Giới hạn số dòng", correct: true }, { text: "Join", correct: false }, { text: "Insert", correct: false }], "MEDIUM");
    await createQ("offset dùng để?", [{ text: "Bỏ qua dòng", correct: true }, { text: "Join", correct: false }, { text: "Insert", correct: false }, { text: "Delete", correct: false }], "MEDIUM");
    await createQ("include dùng để?", [{ text: "Join", correct: true }, { text: "Insert", correct: false }, { text: "Delete", correct: false }, { text: "Sync", correct: false }], "MEDIUM");
    await createQ("belongsTo dùng để?", [{ text: "Quan hệ 1-n", correct: false }, { text: "Quan hệ n-1", correct: true }, { text: "n-n", correct: false }, { text: "Không dùng", correct: false }], "MEDIUM");
    await createQ("hasMany dùng để?", [{ text: "1-n", correct: true }, { text: "n-1", correct: false }, { text: "n-n", correct: false }, { text: "none", correct: false }], "MEDIUM");

    // --- HARD ---
    await createQ("INNER JOIN trả về gì?", [{ text: "Tất cả dữ liệu", correct: false }, { text: "Dữ liệu không khớp", correct: false }, { text: "Dữ liệu khớp giữa 2 bảng", correct: true }, { text: "NULL", correct: false }], "HARD");
    await createQ("LEFT JOIN khác INNER JOIN ở điểm nào?", [{ text: "Không join", correct: false }, { text: "Giữ toàn bộ bảng trái", correct: true }, { text: "Giữ bảng phải", correct: false }, { text: "Không có điều kiện", correct: false }], "HARD");
    await createQ("ON vs WHERE trong JOIN?", [{ text: "WHERE chạy trước", correct: false }, { text: "ON chạy sau", correct: false }, { text: "ON chạy trước", correct: true }, { text: "Không khác", correct: false }], "HARD");
    await createQ("GROUP BY yêu cầu?", [{ text: "Tất cả cột phải aggregate", correct: false }, { text: "Không cần điều kiện", correct: false }, { text: "Cột không aggregate phải nằm trong GROUP BY", correct: true }, { text: "Không dùng với HAVING", correct: false }], "HARD");
    await createQ("HAVING khác WHERE ở điểm nào?", [{ text: "Không lọc", correct: false }, { text: "Lọc sau GROUP BY", correct: true }, { text: "Chỉ dùng với SELECT", correct: false }, { text: "Không dùng được", correct: false }], "HARD");
    await createQ("Event Loop có nhiệm vụ gì?", [{ text: "Tạo thread", correct: false }, { text: "Xử lý tuần tự event", correct: true }, { text: "Lưu file", correct: false }, { text: "Compile code", correct: false }], "HARD");
    await createQ("API Pool dùng để?", [{ text: "Lưu request", correct: false }, { text: "Chạy async task", correct: true }, { text: "Tạo DB", correct: false }, { text: "Xử lý HTML", correct: false }], "HARD");
    await createQ("UNION yêu cầu gì?", [{ text: "Cùng bảng", correct: false }, { text: "Cùng số cột", correct: true }, { text: "Cùng tên bảng", correct: false }, { text: "Không cần điều kiện", correct: false }], "HARD");
    await createQ("CASE WHEN trong SQL giống gì?", [{ text: "loop", correct: false }, { text: "function", correct: false }, { text: "if-else", correct: true }, { text: "class", correct: false }], "HARD");
    await createQ("INNER JOIN tối đa dòng (A=2, B=3)?", [{ text: "2", correct: false }, { text: "3", correct: false }, { text: "6", correct: true }, { text: "5", correct: false }], "HARD");
    await createQ("SELECT COUNT(*) FROM users nghĩa là?", [{ text: "Lấy user", correct: false }, { text: "Đếm số dòng", correct: true }, { text: "Xóa", correct: false }, { text: "Join", correct: false }], "HARD");
    await createQ("const a = await 5; kết quả?", [{ text: "Error", correct: false }, { text: "5", correct: true }, { text: "Promise", correct: false }, { text: "undefined", correct: false }], "HARD");
    await createQ("LEFT JOIN không match thì giá trị bảng phải?", [{ text: "0", correct: false }, { text: "NULL", correct: true }, { text: "error", correct: false }, { text: "bỏ dòng", correct: false }], "HARD");
    await createQ("Promise.resolve(5).then(x=>x*2) trả về?", [{ text: "5", correct: false }, { text: "10", correct: false }, { text: "Promise 10", correct: true }, { text: "undefined", correct: false }], "HARD");
    await createQ("setImmediate vs setTimeout(0)?", [{ text: "giống nhau", correct: false }, { text: "setImmediate chạy trước", correct: true }, { text: "setTimeout chạy trước", correct: false }, { text: "random", correct: false }], "HARD");
    await createQ("HAVING COUNT(*) > 1 nghĩa là?", [{ text: "Lọc nhóm >1", correct: true }, { text: "Lọc dòng", correct: false }, { text: "Join", correct: false }, { text: "Sort", correct: false }], "HARD");
    await createQ("LEFT JOIN với A=2, B=0 kết quả?", [{ text: "0", correct: false }, { text: "2", correct: true }, { text: "1", correct: false }, { text: "lỗi", correct: false }], "HARD");
    await createQ("WHERE age IS NULL nghĩa là?", [{ text: "age = 0", correct: false }, { text: "age rỗng", correct: false }, { text: "age null", correct: true }, { text: "lỗi", correct: false }], "HARD");
    await createQ("User.findAll age > 18 nghĩa là?", [{ text: "age < 18", correct: false }, { text: "age > 18", correct: true }, { text: "age = 18", correct: false }, { text: "lỗi", correct: false }], "HARD");
    await createQ("User.create trả về?", [{ text: "undefined", correct: false }, { text: "Promise", correct: true }, { text: "string", correct: false }, { text: "number", correct: false }], "HARD");
    await createQ("await User.findByPk trả về?", [{ text: "Promise", correct: false }, { text: "Object", correct: true }, { text: "number", correct: false }, { text: "null luôn", correct: false }], "HARD");
    await createQ("include: Post nghĩa là?", [{ text: "Insert", correct: false }, { text: "Join User với Post", correct: true }, { text: "Delete", correct: false }, { text: "Sync", correct: false }], "HARD");
    await createQ("User.update thiếu gì?", [{ text: "where", correct: true }, { text: "include", correct: false }, { text: "limit", correct: false }, { text: "order", correct: false }], "HARD");
    await createQ("User.destroy where id=1 nghĩa là?", [{ text: "Lấy user", correct: false }, { text: "Xóa user id=1", correct: true }, { text: "Update", correct: false }, { text: "Join", correct: false }], "HARD");
    await createQ("attributes: ['name'] nghĩa là?", [{ text: "Lấy tất cả", correct: false }, { text: "Lấy mỗi name", correct: true }, { text: "Delete", correct: false }, { text: "Join", correct: false }], "HARD");
    await createQ("order DESC nghĩa là?", [{ text: "Tăng dần", correct: false }, { text: "Giảm dần", correct: true }, { text: "Random", correct: false }, { text: "Lỗi", correct: false }], "HARD");
  }

  // ==========================================
  // PHẦN 2: TẠO CÂU HỎI TỰ LUẬN (ESSAY) ĐẠI TRÀ
  // (Rải đều cho tất cả các môn học)
  // ==========================================
  console.log("✍️ Seeding ESSAY QUESTIONS (Tự luận) rải đều các môn...");

  const allChapters = await models.chapter.findMany({
    include: { subject: true }
  });

  const createEssayQ = async (chapterId: string, subjectId: string, courseId: string, content: string, difficulty: "EASY" | "MEDIUM" | "HARD") => {
    return models.question.create({
      data: {
        scope: "CHAPTER",
        chapterId,
        subjectId,
        courseId,
        teacherId: teacherId,
        typeId: essayType!.id, // Sử dụng loại câu hỏi tự luận
        questionFormat: "ESSAY",
        content,
        difficulty,
      },
    });
  };

  for (const chap of allChapters) {
    if (!chap.subject) continue;

    const subName = chap.subject.name.toLowerCase();

    // Dựa vào tên Môn học để nhét câu tự luận phù hợp
    if (subName.includes("react") || subName.includes("frontend")) {
      await createEssayQ(chap.id, chap.subject.id, chap.subject.courseId, "Hãy clone project React mẫu trong tài liệu, cấu hình Redux Toolkit, tạo chức năng Todo List đơn giản và nộp lại link Github.", "HARD");
      await createEssayQ(chap.id, chap.subject.id, chap.subject.courseId, "Trình bày sự khác biệt giữa useEffect và useLayoutEffect. Hãy đưa ra một ví dụ thực tế mà bạn buộc phải dùng useLayoutEffect.", "MEDIUM");
    } 
    else if (subName.includes("node") || subName.includes("backend")) {
      await createEssayQ(chap.id, chap.subject.id, chap.subject.courseId, "Viết một RESTful API hoàn chỉnh bằng ExpressJS có sử dụng Middleware xác thực JWT (Login, Register, Get Profile). Nộp link Github.", "HARD");
      await createEssayQ(chap.id, chap.subject.id, chap.subject.courseId, "Trình bày cách xử lý lỗi tập trung (Centralized Error Handling) trong NodeJS và viết đoạn code minh họa.", "MEDIUM");
    } 
    else if (subName.includes("kiểm thử") || subName.includes("qa")) {
      await createEssayQ(chap.id, chap.subject.id, chap.subject.courseId, "Viết kịch bản kiểm thử tự động (Automation Test Script) bằng Selenium hoặc Cypress cho chức năng Đăng nhập. Upload file code.", "HARD");
      await createEssayQ(chap.id, chap.subject.id, chap.subject.courseId, "Hãy phân tích các Test Case (kịch bản kiểm thử) cần thiết cho một trang Giỏ hàng (Cart) của website thương mại điện tử.", "MEDIUM");
    } 
    else if (subName.includes("python")) {
      await createEssayQ(chap.id, chap.subject.id, chap.subject.courseId, "Sử dụng thư viện Pandas để đọc file dữ liệu mẫu CSV, thực hiện lọc các dòng có giá trị null, điền giá trị mặc định và xuất ra biểu đồ phân bổ.", "HARD");
      await createEssayQ(chap.id, chap.subject.id, chap.subject.courseId, "Trình bày ưu và nhược điểm của Tuple so với List trong Python. Khi nào thì nên dùng Tuple?", "EASY");
    } 
    else {
      // Dành cho các môn học khác (Fallback)
      await createEssayQ(chap.id, chap.subject.id, chap.subject.courseId, "Hãy tóm tắt lại kiến thức trọng tâm của chương này theo ý hiểu của bạn (tối thiểu 200 từ).", "EASY");
      await createEssayQ(chap.id, chap.subject.id, chap.subject.courseId, "Áp dụng lý thuyết đã học trong chương này để giải quyết một bài toán thực tế mà bạn gặp phải.", "MEDIUM");
    }
  }

  console.log("✅ DONE SEED QUESTIONS (Bao gồm cả Trắc nghiệm & Tự luận)!");
}

seedQuestions()
  .catch(console.error)
  .finally(() => models.$disconnect());