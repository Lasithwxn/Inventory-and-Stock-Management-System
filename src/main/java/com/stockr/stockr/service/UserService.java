package com.stockr.stockr.service;

import com.stockr.stockr.dto.PasswordChangeDTO;
import com.stockr.stockr.dto.UserProfileDTO;
import com.stockr.stockr.model.User;
import com.stockr.stockr.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ── GET ALL USERS ──
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ── GET USER BY ID (needed for /api/users/{id}) ──
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    // ── CREATE USER ──
    public boolean createUser(String name, String email, String encodedPassword, String role) {
        if (userRepository.findByEmail(email).isPresent()) return false;

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(encodedPassword);
        user.setIsActive(true);

        try {
            user.setRole(User.Role.valueOf(role));
        } catch (IllegalArgumentException e) {
            user.setRole(User.Role.STOCKER);
        }

        userRepository.save(user);
        return true;
    }

    // ── UPDATE USER (name + role) ──
    public boolean updateUser(Long userId, String name, String role) {
        Optional<User> opt = userRepository.findById(userId);
        if (opt.isEmpty()) return false;

        User user = opt.get();

        if (name != null && !name.isBlank()) {
            user.setName(name.trim());
        }

        if (role != null && !role.isBlank()) {
            try {
                user.setRole(User.Role.valueOf(role.toUpperCase()));
            } catch (IllegalArgumentException e) {
                return false;
            }
        }

        userRepository.save(user);
        return true;
    }

    // ── UPDATE ROLE ONLY ──
    public boolean updateRole(Long userId, String newRole) {
        Optional<User> opt = userRepository.findById(userId);
        if (opt.isEmpty()) return false;

        User user = opt.get();
        try {
            user.setRole(User.Role.valueOf(newRole.toUpperCase()));
            userRepository.save(user);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    // ── TOGGLE ACTIVE STATUS ──
    public Boolean toggleStatus(Long userId) {
        Optional<User> opt = userRepository.findById(userId);
        if (opt.isEmpty()) return null;

        User user = opt.get();
        boolean newStatus = !Boolean.TRUE.equals(user.getIsActive());
        user.setIsActive(newStatus);
        userRepository.save(user);
        return newStatus;
    }

    // ── DELETE USER ──
    public boolean deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) return false;
        userRepository.deleteById(userId);
        return true;
    }

    // ========== NEW PROFILE METHODS ==========

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String email = auth.getName();
            Optional<User> user = userRepository.findByEmail(email);
            if (user.isPresent()) return user.get();
        }
        // ❌ REMOVED: do NOT fall back to a random user — return null instead
        return null;
    }

    public User updateProfile(UserProfileDTO dto) {
        User user = getCurrentUser();
        if (user == null) return null;

        if (dto.getFirstName() != null) user.setName(dto.getFirstName());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        // TODO: if your User model has phone/department fields, map them here too
        // if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        // if (dto.getDepartment() != null) user.setDepartment(dto.getDepartment());

        return userRepository.save(user);
    }

    public boolean changePassword(PasswordChangeDTO dto) {
        User user = getCurrentUser();
        if (user == null) return false;

        // TODO: wire in PasswordEncoder and verify current password before updating
        // Example:
        // if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) return false;
        // user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        // userRepository.save(user);

        return true; // placeholder — replace with real logic
    }

    public void deleteCurrentUser() {
        User user = getCurrentUser();
        if (user != null) {
            user.setIsActive(false);
            userRepository.save(user);
        }
    }
}