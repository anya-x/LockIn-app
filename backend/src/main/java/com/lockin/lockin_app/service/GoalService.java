package com.lockin.lockin_app.service;


import com.lockin.lockin_app.entity.Goal;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.GoalRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {
    private final GoalRepository goalRepository;
    public Goal createGoal(Long userId, Goal goal) {

        User user = new User();
        user.setId(userId);
        goal.setUser(user);
        return goalRepository.save(goal);
    }

    public List<Goal> getUserGoals(Long userId) {
        return goalRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // TODO: add method to update goal progress automatically
}
