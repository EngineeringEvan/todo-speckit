<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const addDialog = ref(false);
const renameDialog = ref(false);
const deleteDialog = ref(false);
const saving = ref(false);
const newListName = ref("");
const renameName = ref("");
const activeList = ref(null);

const addFormRef = ref(null);
const renameFormRef = ref(null);
const nameRules = [(v) => !!v?.trim() || "List name is required."];

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
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Failed to delete list.";
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
  </v-container>
</template>
