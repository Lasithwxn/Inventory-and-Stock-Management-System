package com.stockr.stockr.service;

import com.stockr.stockr.model.Feedback;
import com.stockr.stockr.model.PurchaseOrder;
import com.stockr.stockr.model.User;
import com.stockr.stockr.repository.FeedbackRepository;
import com.stockr.stockr.repository.PurchaseOrderRepository;
import com.stockr.stockr.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.Writer;
import java.util.List;

@Service
public class ReportExportService {

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private UserRepository userRepository;

    public void writeCsv(String category, Writer writer) throws IOException {
        writer.write('\ufeff');
        switch (category.toUpperCase()) {
            case "SALES":
            case "ORDER":
                writeOrders(writer);
                break;
            case "INVENTORY":
                writeInventory(writer);
                break;
            case "USER":
                writeUsers(writer);
                break;
            case "SUPPLIER":
                writeSuppliers(writer);
                break;
            case "FEEDBACK":
                writeFeedback(writer);
                break;
            default:
                writer.write("Report,data,coming,soon\n");
        }
    }

    private void writeOrders(Writer w) throws IOException {
        w.write("ID,Supplier ID,Ordered By,Status,Order Date,Expected Date,Notes,Created At\n");
        List<PurchaseOrder> list = purchaseOrderRepository.findAll();
        for (PurchaseOrder o : list) {
            w.write(csv(o.getId(), o.getSupplierId(), o.getOrderedBy(), o.getStatus(),
                    o.getOrderDate(), o.getExpectedDate(), o.getNotes(), o.getCreatedAt()));
        }
    }

    private void writeUsers(Writer w) throws IOException {
        w.write("ID,Name,Email,Role,Active,Created At\n");
        List<User> list = userRepository.findAll();
        for (User u : list) {
            w.write(csv(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getIsActive(), u.getCreatedAt()));
        }
    }

    private void writeFeedback(Writer w) throws IOException {
        w.write("ID,Submitter Name,Rating,Category ID,Message,Is Bug Report,Created At\n");
        List<Feedback> list = feedbackRepository.findAll();
        for (Feedback f : list) {
            w.write(csv(f.getId(), f.getSubmitterName(), f.getRating(), f.getCategoryId(),
                    f.getMessage(), f.getIsBugReport(), f.getCreatedAt()));
        }
    }

    private void writeInventory(Writer w) throws IOException {
        w.write("Product,SKU,Category,Unit Price,Stock Qty,Status\n");
        w.write("Demo,INV-001,Electronics,4500.00,145,IN_STOCK\n");
    }

    private void writeSuppliers(Writer w) throws IOException {
        w.write("ID,Name,Contact,Email,Phone,Address,Active\n");
        w.write("1,TechSupply Co.,Kamal,kamal@tech.lk,+94711234567,Colombo,true\n");
    }

    private String csv(Object... cols) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cols.length; i++) {
            String v = cols[i] == null ? "" : cols[i].toString().replace("\"", "\"\"");
            if (v.contains(",") || v.contains("\"") || v.contains("\n")) {
                sb.append("\"").append(v).append("\"");
            } else {
                sb.append(v);
            }
            sb.append(i == cols.length - 1 ? "\n" : ",");
        }
        return sb.toString();
    }
}