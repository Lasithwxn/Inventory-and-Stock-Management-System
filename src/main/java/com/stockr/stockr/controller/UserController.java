package com.stockr.stockr.controller;

import com.stockr.stockr.dto.PasswordChangeDTO;
import com.stockr.stockr.dto.UserProfileDTO;
import com.stockr.stockr.model.User;
import com.stockr.stockr.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:8080", allowCredentials = "true")
public class UserController {

    private final UserService userService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ── GET ALL USERS ──
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserDTO> dtos = users.stream().map(UserDTO::from).toList();
        return ResponseEntity.ok(dtos);
    }

    // ── GET MY PROFILE ──
    @GetMapping("/me")
    public ResponseEntity<UserProfileDTO> getMyProfile() {
        User user = userService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(mapToProfileDTO(user));
    }

    // ── UPDATE MY PROFILE ──
    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody UserProfileDTO dto) {
        User updated = userService.updateProfile(dto);
        Map<String, Object> res = new HashMap<>();
        if (updated != null) {
            res.put("success", true);
            res.put("message", "Profile updated");
            res.put("data", mapToProfileDTO(updated));
        } else {
            res.put("success", false);
            res.put("message", "User not found");
        }
        return ResponseEntity.ok(res);
    }

    // ── CHANGE MY PASSWORD ──
    @PostMapping("/me/password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody PasswordChangeDTO dto) {
        boolean success = userService.changePassword(dto);
        Map<String, Object> res = new HashMap<>();
        res.put("success", success);
        res.put("message", success ? "Password changed successfully" : "Current password is incorrect");
        return ResponseEntity.ok(res);
    }

    // ── DELETE MY ACCOUNT ──
    @DeleteMapping("/me")
    public ResponseEntity<Map<String, Object>> deleteAccount() {
        userService.deleteCurrentUser();
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Account deleted");
        return ResponseEntity.ok(res);
    }

    // ── CREATE USER ──
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String role = body.get("role");

        if (name == null || name.isBlank() || email == null || email.isBlank() ||
                password == null || password.isBlank() || role == null || role.isBlank()) {
            response.put("success", false);
            response.put("message", "All fields are required.");
            return ResponseEntity.badRequest().body(response);
        }

        boolean created = userService.createUser(
                name.trim(),
                email.trim().toLowerCase(),
                passwordEncoder.encode(password),
                role.toUpperCase()
        );

        response.put("success", created);
        response.put("message", created ? "User created successfully." : "Email already exists.");
        return ResponseEntity.ok(response);
    }

    // ── UPDATE USER ──
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String name = body.get("name");
        String role = body.get("role");
        Map<String, Object> response = new HashMap<>();

        boolean updated = userService.updateUser(id, name, role);
        response.put("success", updated);
        response.put("message", updated ? "User updated successfully." : "User not found or invalid data.");
        return ResponseEntity.ok(response);
    }

    // ── UPDATE ROLE ──
    @PutMapping("/{id}/role")
    public ResponseEntity<Map<String, Object>> updateRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newRole = body.get("role");
        Map<String, Object> response = new HashMap<>();

        if (newRole == null || newRole.isBlank()) {
            response.put("success", false);
            response.put("message", "Role field is required.");
            return ResponseEntity.badRequest().body(response);
        }

        boolean updated = userService.updateRole(id, newRole);
        response.put("success", updated);
        response.put("message", updated ? "Role updated to " + newRole.toUpperCase() + "." : "User not found or invalid role.");
        return ResponseEntity.ok(response);
    }

    // ── TOGGLE STATUS ──
    @PutMapping("/{id}/status/toggle")
    public ResponseEntity<Map<String, Object>> toggleStatus(@PathVariable Long id) {
        Boolean newStatus = userService.toggleStatus(id);
        Map<String, Object> response = new HashMap<>();

        if (newStatus == null) {
            response.put("success", false);
            response.put("message", "User not found.");
            return ResponseEntity.ok(response);
        }

        response.put("success", true);
        response.put("message", "User " + (newStatus ? "activated" : "suspended") + " successfully.");
        response.put("isActive", newStatus);
        return ResponseEntity.ok(response);
    }

    // ── DELETE USER ──
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        boolean deleted = userService.deleteUser(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", deleted);
        response.put("message", deleted ? "User deleted successfully." : "User not found.");
        return ResponseEntity.ok(response);
    }

    // ── DTO HELPERS ──
    private UserProfileDTO mapToProfileDTO(User user) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setId(user.getId());
        dto.setFirstName(user.getName());
        dto.setLastName("");
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole() != null ? user.getRole().name() : "STOCKER");
        dto.setEmpId("USR-" + String.format("%03d", user.getId()));
        dto.setDepartment("Inventory Management");
        dto.setJoined(user.getCreatedAt() != null ? user.getCreatedAt().toLocalDate().toString() : "2024-01-15");
        return dto;
    }

    public static class UserDTO {
        public Long id;
        public String name;
        public String email;
        public String studentId;
        public String role;
        public Boolean isActive;

        public static UserDTO from(User u) {
            UserDTO dto = new UserDTO();
            dto.id = u.getId();
            dto.name = u.getName();
            dto.email = u.getEmail();
            dto.role = u.getRole() != null ? u.getRole().name() : "STOCKER";
            dto.isActive = Boolean.TRUE.equals(u.getIsActive());
            dto.studentId = null;
            return dto;
        }
    }
}