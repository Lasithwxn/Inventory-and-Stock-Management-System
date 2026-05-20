package com.stockr.stockr.dto;

public class DailyOrderCountDTO {
    private String date;
    private int value;

    public DailyOrderCountDTO(String date, int value) {
        this.date = date;
        this.value = value;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public int getValue() { return value; }
    public void setValue(int value) { this.value = value; }
}