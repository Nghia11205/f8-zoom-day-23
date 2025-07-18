// const { act } = require("react");
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const addTaskModal = $("#addTaskModal");
// Modal elements
const todoAdd = $(".add-btn");
const modalClose = $(".btn-secondary");
// Modal close button
const modalCloseBtn = $(".modal-close");
const inputElement = $("#taskTitle");
const todoAppForm = $(".todo-app-form");
const todoGrid = $("#todo-list");
let editIndex = null;
const todoSearch = $(".search-input");
const tabList = $(".tab-list");
//---------------
function openModal() {
    addTaskModal.classList.toggle("show");
}
todoAdd.onclick = function (event) {
    event.preventDefault();
    // Focus input dau tien khi mo modal
    // Hien thi modal
    openModal();
    setTimeout(() => {
        inputElement.focus();
    }, 300);
};

// Xu ly su kien submit form
todoAppForm.onsubmit = function (event) {
    event.preventDefault();
    const formData = {
        title: inputElement.value,
        description: $("#taskDescription").value,
        category: $("#taskCategory").value,
        priority: $("#taskPriority").value,
        startTime: $("#startTime").value,
        endTime: $("#endTime").value,
        duaDate: $("#taskDate").value,
        cardColor: $("#taskColor").value,
        isCompleted: false,
    };
    //Nếu có editIndex -> Thực hiện logic sửa
    if (editIndex !== null && editIndex !== undefined) {
        const isDuplicate = todoTasks.some((task, index) => {
            return index !== editIndex && task.title === formData.title;
        });
        if (isDuplicate) {
            showToast("Tiêu đề đã tồn tại, hãy dùng tên khác!", "warning");
            return;
        }
        todoTasks[editIndex] = formData;
        saveTasks();
        renderTasks();
        closeModal();
        showToast("Cập nhật task thành công!", "success");
    }
    //KHông có editIndex -> THực hiện logic thêm mới
    else {
        let checkTitle = true;
        todoTasks.forEach((task) => {
            if (formData.title === task.title) {
                checkTitle = false;
            }
        });
        if (checkTitle) {
            todoTasks.unshift(formData);
            // Lưu toàn bộ danh sách vào localStorage.
            saveTasks();
            renderTasks();
            closeModal();
            showToast("Thêm task thành công", "success");
        } else {
            showToast("Tiêu đề task đã tồn tại. Vui lòng nhập lại.", "warning");
            inputElement.focus();
        }
    }
};
// Hiển thị thông báo.
function showToast(message, type = "error") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = "toast hidden";
    }, 3000);
}
//edit: Khi nhấn edit sẽ hiện ra modal đã chứa sẵn thông tin tương ứng của task đó
todoGrid.onclick = function (event) {
    const editBtn = event.target.closest(".edit-btn");
    const deleteBtn = event.target.closest(".delete-btn");
    const completeBtn = event.target.closest(".complete-btn");
    //EDIT: Khi nhắn vào edit sẽ hiện ra modal (Bước 1)
    if (editBtn) {
        const taskIndex = editBtn.dataset.index;
        const task = todoTasks[taskIndex];
        editIndex = Number(taskIndex);
        //Điền đẩy đủ thông tin của task vào form mới (bước 2)
        for (const key in task) {
            const value = task[key];
            const input = $(`[name="${key}"]`);
            if (input) {
                input.value = value;
            }
        }
        const formTitle = addTaskModal.querySelector(".modal-title");
        if (formTitle) {
            formTitle.dataset.original = formTitle.textContent;
            formTitle.textContent = "Edit Task";
        }

        const btnSubmit = addTaskModal.querySelector(".btn-submit");
        if (btnSubmit) {
            btnSubmit.dataset.original = btnSubmit.textContent;
            btnSubmit.textContent = "Save Task";
        }
        openModal();
    }

    //DELETE
    if (deleteBtn) {
        const taskIndex = deleteBtn.dataset.index;
        const task = todoTasks[taskIndex];
        if (confirm(`Bạn chắc chắn muốn xoá công việc này không?`)) {
            todoTasks.splice(taskIndex, 1);
            saveTasks();
            renderTasks();
        }
    }

    // Completed
    if (completeBtn) {
        const taskIndex = completeBtn.dataset.index;
        const task = todoTasks[taskIndex];
        task.isCompleted = !task.isCompleted;
        saveTasks();
        renderTasks();
    }
};
//Tim kiem va hien thi cac task co lien quan
todoSearch.oninput = function (event) {
    //Chuyển về tab All khi search
    activeTarget(tabList.querySelector(".all-btn"));
    const searchContent = event.target.value.trim();
    const tasksSearch = todoTasks.filter((task) => {
        const titleSearch = task["title"];
        const descriptionSearch = task["description"];
        return (
            titleSearch.toLowerCase().includes(searchContent.toLowerCase()) ||
            descriptionSearch
                .toLowerCase()
                .includes(searchContent.toLowerCase())
        );
    });
    if (tasksSearch.length > 0) {
        renderTasks(tasksSearch);
    } else {
        renderTasks([]); // clear giao diện khi mình không tìm thấy.
        const todoList = document.querySelector(".task-grid");
        todoList.innerHTML = `
    <div class="no-result">
        <img src="https://cdn-icons-png.flaticon.com/512/6134/6134065.png" alt="Not found" />
        <p>Không tìm thấy công việc phù hợp 😥</p>
    </div>`;
    }
};
//Loc Task
tabList.onclick = function (event) {
    const allBtn = event.target.closest(".all-btn");
    const activeBtn = event.target.closest(".active-btn");
    const completedBtn = event.target.closest(".completed-btn");

    if (allBtn) {
        activeTarget(allBtn);
        renderTasks();
    }

    if (activeBtn) {
        activeTarget(activeBtn);
        const taskActive = todoTasks.filter((task) => {
            return !task.isCompleted;
        });
        renderTasks(taskActive);
    }

    if (completedBtn) {
        activeTarget(completedBtn);
        const taskCompleted = todoTasks.filter((task) => {
            return task.isCompleted;
        });
        renderTasks(taskCompleted);
    }
};

//Hien trang thai khi focus vao button.
function activeTarget(target) {
    const allTabs = tabList.querySelectorAll(
        ".all-btn, .active-btn, .completed-btn"
    );
    allTabs.forEach((btn) => btn.classList.remove("active"));
    target.className = `${target.className} active`;
}
function renderTasks() {
    fetch(`http://localhost:3000/tasks`)
        .then((res) => res.json())
        .then((result) => {
            const html = result
                .map(
                    (task, index) => `<div class="task-card ${escapeHTML(
                        task.cardColor
                    )} ${task.isCompleted ? "completed" : ""}">
                <div class="task-header">
                    <h3 class="task-title">${escapeHTML(task.title)}</h3>
                    <button class="task-menu">
                        <i class="fa-solid fa-ellipsis fa-icon"></i>
                        <div class="dropdown-menu">
                            <div class="dropdown-item edit-btn" data-index="${index}">
                                <i class="fa-solid fa-pen-to-square fa-icon"></i>
                                Edit
                            </div>
                            <div class="dropdown-item complete complete-btn" data-index="${index}">
                                <i class="fa-solid fa-check fa-icon"></i>
                                Mark as ${
                                    task.isCompleted ? "Active" : "Complete"
                                }
                            </div>
                            <div class="dropdown-item delete delete-btn" data-index="${index}">
                                <i class="fa-solid fa-trash fa-icon"></i>
                                Delete
                            </div>
                        </div>
                    </button>
                </div>
                <p class="task-description">${escapeHTML(task.description)}</p>
                <div class="task-time">${task.startTime} - ${task.endTime}</div>
            </div>`
                )
                .join("");
            const todoList = $(`.task-grid`);
            todoList.innerHTML = html;
        });
}
function closeModal() {
    addTaskModal.classList.toggle("show");

    //Bước 3(edit) khi đóng thì trả lại giá trị ban đầu cho title và create.
    const formTitle = addTaskModal.querySelector(".modal-title");
    if (formTitle) {
        formTitle.textContent =
            formTitle.dataset.original ?? formTitle.textContent;
        delete formTitle.dataset.original;
    }
    const btnSubmit = addTaskModal.querySelector(".btn-submit");
    if (btnSubmit) {
        btnSubmit.textContent =
            btnSubmit.dataset.original ?? btnSubmit.textContent;
        delete btnSubmit.dataset.original;
    }

    //Xử lý cuộn để luôn ở trên đầu.
    setTimeout(() => {
        addTaskModal.querySelector(".modal").scrollTop = 0;
    }, 300);

    // Reset form về giá trị ban đầu.
    todoAppForm.reset();

    // Reset editIndex (căn cứ để bt form đang ở trạng thái sửa hay thêm).
    editIndex = null;
}
function saveTasks() {
    localStorage.setItem("todoTasks", JSON.stringify(todoTasks));
}
// Dong modal khi click vao nut create hoac cancel
modalClose.onclick = function (event) {
    event.preventDefault();
    // Dong modal
    closeModal();
};

// Dong modal khi click vao nut close
modalCloseBtn.onclick = function (event) {
    event.preventDefault();
    // Dong modal
    closeModal();
};
//Khi an nut Create se render ra task moi tuong tu khi submit form.
$(`.btn-primary`).onclick = function (event) {
    event.preventDefault();
    todoAppForm.requestSubmit();
};

renderTasks();
function escapeHTML(html) {
    const div = document.createElement("div");
    div.textContent = html;
    return div.innerHTML;
}

const modal = $(".modal");
console.log(modal);
addTaskModal.onclick = function (e) {
    if (!e.target.closest(".modal")) {
        this.classList.toggle("show");
    }
};
