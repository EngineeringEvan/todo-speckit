<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";
import todoServices from "../services/todoServices.js";
import { formatDueDate, isTodoOverdue, optionalDueDateRules } from "../config/validation.js";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const addDialog = ref(false);
const renameDialog = ref(false);
const deleteDialog = ref(false);
const itemsDialog = ref(false);
const addItemDialog = ref(false);
const editItemDialog = ref(false);
const deleteItemDialog = ref(false);
const saving = ref(false);
const itemsLoading = ref(false);
const itemsError = ref("");
const newListName = ref("");
const renameName = ref("");
const activeList = ref(null);
const todos = ref([]);
const newTodoTitle = ref("");
const newDueDate = ref("");
const editTodoTitle = ref("");
const editDueDate = ref("");
const activeTodo = ref(null);

const addFormRef = ref(null);
const renameFormRef = ref(null);
const addItemFormRef = ref(null);
const editItemFormRef = ref(null);
const nameRules = [(v) => !!v?.trim() || "List name is required."];
const titleRules = [(v) => !!v?.trim() || "Todo title is required."];

const loadLists = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await listServices.getAll();
    lists.value = res.data;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Failed to load lists.";
  } finally {
    loading.value = false;
  }
};

const loadTodos = async () => {
  if (!activeList.value) {
    return;
  }

  itemsLoading.value = true;
  itemsError.value = "";
  try {
    const res = await todoServices.getAll(activeList.value.id);
    todos.value = res.data;
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Failed to load todos.";
  } finally {
    itemsLoading.value = false;
  }
};

const openAddDialog = () => {
  newListName.value = "";
  addDialog.value = true;
};

const createList = async () => {
  if (!addFormRef.value) {
    return;
  }

  const { valid } = await addFormRef.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  try {
    await listServices.createList({ name: newListName.value.trim() });
    addDialog.value = false;
    newListName.value = "";
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Failed to create list.";
  } finally {
    saving.value = false;
  }
};

const openRenameDialog = (list) => {
  activeList.value = list;
  renameName.value = list.name;
  renameDialog.value = true;
};

const renameList = async () => {
  if (!renameFormRef.value || !activeList.value) {
    return;
  }

  const { valid } = await renameFormRef.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  try {
    await listServices.updateList(activeList.value.id, {
      name: renameName.value.trim(),
    });
    renameDialog.value = false;
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Failed to rename list.";
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (list) => {
  activeList.value = list;
  deleteDialog.value = true;
};

const deleteList = async () => {
  if (!activeList.value) {
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  try {
    await listServices.deleteList(activeList.value.id);
    deleteDialog.value = false;
    itemsDialog.value = false;
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Failed to delete list.";
  } finally {
    saving.value = false;
  }
};

const openItemsDialog = async (list) => {
  activeList.value = list;
  todos.value = [];
  itemsDialog.value = true;
  await loadTodos();
};

const closeItemsDialog = () => {
  itemsDialog.value = false;
  addItemDialog.value = false;
  editItemDialog.value = false;
  deleteItemDialog.value = false;
};

const openAddItemDialog = () => {
  newTodoTitle.value = "";
  newDueDate.value = "";
  addItemDialog.value = true;
};

const createTodo = async () => {
  if (!addItemFormRef.value || !activeList.value) {
    return;
  }

  const { valid } = await addItemFormRef.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  itemsError.value = "";
  try {
    const payload = { title: newTodoTitle.value.trim() };
    if (newDueDate.value) {
      payload.dueDate = newDueDate.value;
    }
    await todoServices.createTodo(activeList.value.id, payload);
    addItemDialog.value = false;
    newTodoTitle.value = "";
    newDueDate.value = "";
    await loadTodos();
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Failed to create todo.";
  } finally {
    saving.value = false;
  }
};

const toggleTodo = async (todo) => {
  try {
    await todoServices.updateTodo(todo.id, { completed: !todo.completed });
    await loadTodos();
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Failed to update todo.";
  }
};

const openEditItemDialog = (todo) => {
  activeTodo.value = todo;
  editTodoTitle.value = todo.title;
  editDueDate.value = todo.dueDate ? String(todo.dueDate).slice(0, 10) : "";
  editItemDialog.value = true;
};

const saveTodoTitle = async () => {
  if (!editItemFormRef.value || !activeTodo.value) {
    return;
  }

  const { valid } = await editItemFormRef.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  itemsError.value = "";
  try {
    await todoServices.updateTodo(activeTodo.value.id, {
      title: editTodoTitle.value.trim(),
      dueDate: editDueDate.value || null,
    });
    editItemDialog.value = false;
    await loadTodos();
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Failed to update todo.";
  } finally {
    saving.value = false;
  }
};

const openDeleteItemDialog = (todo) => {
  activeTodo.value = todo;
  deleteItemDialog.value = true;
};

const confirmDeleteTodo = async () => {
  if (!activeTodo.value) {
    return;
  }

  saving.value = true;
  itemsError.value = "";
  try {
    await todoServices.deleteTodo(activeTodo.value.id);
    deleteItemDialog.value = false;
    await loadTodos();
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Failed to delete todo.";
  } finally {
    saving.value = false;
  }
};

onMounted(loadLists);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg" elevation="2" class="pa-4">
      <v-card-item>
        <template #title>
          <h1 class="text-h5">My Lists</h1>
        </template>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New List
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-alert
          v-if="errorMessage"
          type="error"
          density="compact"
          class="mb-4"
        >
          {{ errorMessage }}
        </v-alert>

        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <p v-else-if="lists.length === 0" class="text-body-1">
          No lists yet. Create your first list.
        </p>

        <v-list v-else>
          <v-list-item
            v-for="list in lists"
            :key="list.id"
            :title="list.name"
          >
            <template #append>
              <v-btn
                icon="mdi-format-list-checks"
                size="small"
                variant="text"
                aria-label="Items"
                @click="openItemsDialog(list)"
              />
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                aria-label="Edit list"
                @click="openRenameDialog(list)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                aria-label="Delete list"
                @click="openDeleteDialog(list)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-dialog v-model="addDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title>New List</v-card-title>
        <v-card-text>
          <v-form ref="addFormRef">
            <v-text-field
              v-model="newListName"
              label="List name"
              density="comfortable"
              rounded="lg"
              :rules="nameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="createList"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="renameDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title>Rename List</v-card-title>
        <v-card-text>
          <v-form ref="renameFormRef">
            <v-text-field
              v-model="renameName"
              label="List name"
              density="comfortable"
              rounded="lg"
              :rules="nameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="renameDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="renameList"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title>Delete List</v-card-title>
        <v-card-text>
          Delete {{ activeList?.name }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="deleteList"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="itemsDialog" max-width="640">
      <v-card rounded="lg">
        <v-card-item>
          <template #title>
            {{ activeList?.name }} — Items
          </template>
          <template #append>
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              @click="openAddItemDialog"
            >
              + Add Item
            </v-btn>
          </template>
        </v-card-item>
        <v-card-text>
          <v-alert
            v-if="itemsError"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ itemsError }}
          </v-alert>
          <v-progress-linear v-if="itemsLoading" indeterminate class="mb-4" />
          <p v-else-if="todos.length === 0">No todos in this list yet.</p>
          <v-list v-else>
            <v-list-item v-for="todo in todos" :key="todo.id">
              <template #prepend>
                <v-checkbox-btn
                  :model-value="todo.completed"
                  :aria-label="`Toggle ${todo.title}`"
                  @click="toggleTodo(todo)"
                />
              </template>
              <v-list-item-title :class="{ 'text-decoration-line-through text-medium-emphasis': todo.completed }">
                {{ todo.title }}
                <span
                  v-if="todo.dueDate"
                  class="ms-2 text-body-2"
                  :class="{ 'text-error': isTodoOverdue(todo) }"
                >
                  {{ formatDueDate(todo.dueDate) }}
                </span>
              </v-list-item-title>
              <template #append>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  aria-label="Edit todo"
                  @click="openEditItemDialog(todo)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  aria-label="Delete todo"
                  @click="openDeleteItemDialog(todo)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeItemsDialog">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addItemDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title>Add Item</v-card-title>
        <v-card-text>
          <v-form ref="addItemFormRef">
            <v-text-field
              v-model="newTodoTitle"
              label="Todo title"
              density="comfortable"
              rounded="lg"
              :rules="titleRules"
            />
            <v-text-field
              v-model="newDueDate"
              label="Due date"
              type="date"
              density="comfortable"
              rounded="lg"
              :rules="optionalDueDateRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addItemDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="createTodo"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editItemDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title>Edit Item</v-card-title>
        <v-card-text>
          <v-form ref="editItemFormRef">
            <v-text-field
              v-model="editTodoTitle"
              label="Todo title"
              density="comfortable"
              rounded="lg"
              :rules="titleRules"
            />
            <v-text-field
              v-model="editDueDate"
              label="Due date"
              type="date"
              density="comfortable"
              rounded="lg"
              :rules="optionalDueDateRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editItemDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="saveTodoTitle"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteItemDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title>Delete Item</v-card-title>
        <v-card-text>
          Delete {{ activeTodo?.title }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteItemDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="confirmDeleteTodo"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
