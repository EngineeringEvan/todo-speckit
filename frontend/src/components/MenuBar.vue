<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import userServices from "../services/userServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));
const menuOpen = ref(false);
const editDialog = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const formRef = ref(null);

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const fNameRules = [(v) => !!v?.trim() || "First name is required."];
const lNameRules = [(v) => !!v?.trim() || "Last name is required."];
const usernameRules = [(v) => !!v?.trim() || "Username is required."];
const passwordRules = [
  (v) => !v || v.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (v) => v === password.value || "Passwords do not match.",
];

const fullName = computed(() => {
  const current = user.value;
  if (!current) {
    return "";
  }
  return `${current.fName || ""} ${current.lName || ""}`.trim();
});

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

const openEditDialog = () => {
  const current = user.value || {};
  fName.value = current.fName || "";
  lName.value = current.lName || "";
  email.value = current.email || "";
  username.value = current.username || "";
  password.value = "";
  confirmPassword.value = "";
  errorMessage.value = "";
  editDialog.value = true;
};

const closeEditDialog = () => {
  editDialog.value = false;
};

const saveProfile = async () => {
  if (!formRef.value || !user.value) {
    return;
  }

  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  try {
    const payload = {
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
    };
    if (password.value) {
      payload.password = password.value;
    }

    const res = await userServices.updateUser(user.value.userId || user.value.id, payload);
    const stored = Utils.getStore("user") || {};
    Utils.setStore("user", {
      ...stored,
      userId: res.data.id,
      fName: res.data.fName,
      lName: res.data.lName,
      email: res.data.email,
      username: res.data.username,
      role: res.data.role,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    refreshUser();
    editDialog.value = false;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Failed to update profile.";
  } finally {
    saving.value = false;
  }
};

const handleLogout = async () => {
  try {
    await authServices.logoutUser();
  } catch {
    // Continue client logout even if the API call fails
  } finally {
    Utils.removeItem("user");
    await router.push({ name: "login" });
  }
};

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Todo</v-app-bar-title>
    <v-spacer />
    <v-menu v-model="menuOpen">
      <template #activator="{ props }">
        <v-btn
          icon="mdi-account-circle"
          variant="text"
          aria-label="Profile"
          v-bind="props"
        />
      </template>
      <v-list>
        <v-list-item :title="fullName" :subtitle="user?.username">
          <template #subtitle>
            <div>{{ user?.username }}</div>
            <div>{{ user?.email }}</div>
          </template>
        </v-list-item>
        <v-list-item>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openEditDialog"
          >
            Edit Profile
          </v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn variant="text" @click="handleLogout">Log out</v-btn>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="editDialog" max-width="520">
    <v-card rounded="lg">
      <v-card-title>Edit Profile</v-card-title>
      <v-card-text>
        <v-alert
          v-if="errorMessage"
          type="error"
          density="compact"
          class="mb-4"
        >
          {{ errorMessage }}
        </v-alert>
        <v-form ref="formRef">
          <v-text-field v-model="fName" label="First name" density="comfortable" rounded="lg" :rules="fNameRules" />
          <v-text-field v-model="lName" label="Last name" density="comfortable" rounded="lg" :rules="lNameRules" />
          <v-text-field v-model="email" label="Email" density="comfortable" rounded="lg" :rules="emailRules" />
          <v-text-field v-model="username" label="Username" density="comfortable" rounded="lg" :rules="usernameRules" />
          <v-text-field v-model="password" label="New password" type="password" density="comfortable" rounded="lg" :rules="passwordRules" />
          <v-text-field v-model="confirmPassword" label="Confirm password" type="password" density="comfortable" rounded="lg" :rules="confirmPasswordRules" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="closeEditDialog">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="saving"
          @click="saveProfile"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
