package com.lockin.lockin_app.ai;

import lombok.AllArgsConstructor;
import lombok.Data;


@Data
@AllArgsConstructor
public class ClaudeResponse {


    private String text;


    private int inputTokens;


    private int outputTokens;


    private String model;


}
