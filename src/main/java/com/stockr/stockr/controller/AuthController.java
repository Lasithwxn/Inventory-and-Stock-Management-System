package com.stockr.stockr.controller;

import com.stockr.stockr.model.User;
import com.stockr.stockr.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ── LOGIN ──
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String email    = body.get("email");
        String password = body.get("password");
        Map<String, Object> response = new HashMap<>();

        // Guard missing fields
        if (email == null || email.trim().isEmpty() ||
                password == null || password.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email and password are required");
            return ResponseEntity.ok(response);
        }

        Optional<User> found = userRepository.findByEmail(email.trim());

        if (found.isPresent() && passwordEncoder.matches(password, found.get().getPassword())) {
            User user = found.get();

            // Block inactive users
            if (Boolean.FALSE.equals(user.getIsActive())) {
                response.put("success", false);
                response.put("message", "Account is deactivated. Contact your administrator.");
                return ResponseEntity.ok(response);
            }

            // SAFE role handling — prevents 500 if role is NULL
            String roleStr = (user.getRole() != null) ? user.getRole().toString() : "UNKNOWN";

            HttpSession session = request.getSession(true);
            session.setAttribute("userId", user.getId());
            session.setAttribute("role",   roleStr);
            session.setAttribute("name",   user.getName());

            response.put("success", true);
            response.put("role",    roleStr);
            response.put("name",    user.getName());
        } else {
            response.put("success", false);
            response.put("message", "Invalid email or password");
        }

        return ResponseEntity.ok(response);
    }

    // ── REGISTER ──
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @RequestBody Map<String, String> body) {

        String name     = body.get("name");
        String email    = body.get("email");
        String password = body.get("password");

        Map<String, Object> response = new HashMap<>();

        // Validate required fields
        if (name == null || name.trim().isEmpty() ||
                email == null || email.trim().isEmpty() ||
                password == null || password.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Name, email and password are required");
            return ResponseEntity.ok(response);
        }

        // Check if email already exists
        if (userRepository.findByEmail(email).isPresent()) {
            response.put("success", false);
            response.put("message", "An account with this email already exists");
            return ResponseEntity.ok(response);
        }

        // Create new user — default role is STOCKER
        User user = new User();
        user.setName(name.trim());
        user.setEmail(email.trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(User.Role.STOCKER);
        user.setIsActive(true);

        userRepository.save(user);

        response.put("success", true);
        response.put("message", "Account created successfully");
        return ResponseEntity.ok(response);
    }

    // ── LOGOUT ──
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ── ME ──
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Map<String, Object> response = new HashMap<>();

        if (session != null && session.getAttribute("userId") != null) {
            response.put("success", true);
            response.put("role",    session.getAttribute("role"));
            response.put("name",    session.getAttribute("name"));
        } else {
            response.put("success", false);
            response.put("message", "Not logged in");
        }

        return ResponseEntity.ok(response);
    }
}