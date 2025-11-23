There are two ways to place an order. The first and primary way is to do so from the mobile application. However, the admin can create the order as well from admin side.
This is the admin side and we are doing the admin side implementation. We'll do the mobile app implementation in the mobile app codebase. However, the business logic will be same.
Let me explain the business logic, then we'll do the necessary modifications.
We have to update OrderStatus and PaymentStatus flow in this way.

- On admin side, the admiin fills the create new order form, including:

  - Selecting the customer
  - Selecting products and their quantities
  - Adding delivery information
  - Selecting a payment method
  - Pressing the create order button

- This is equivalent to this on the mobile app:

  - Customer adds products to cart
  - Customer goes to checkout screen
  - Customer fills delivery information
  - Customer goes to payment method selection screen
  - Customer places the order

- Regarding the payment method selection:

  - If the admin on admin side or the customer on mobile app side selects "Cash on Delivery" (COD), they can simply create/place the order.
  - They can choose one of the online payment methods including, JazzCash, EasyPaisa or Bank Transfer.
  - If they select one of these payment methods, account information will be shown to them. They will directly transfer the amount to the shown account and upload the screenshot of the payment receipt on that page. After that, they can create/place the order.

- Another thing to mention is that, after an order has been created, the admin will confirm the order on admin side whether it is created from admin side or mobile app side.
- The admin will also confirm the payment if the payment method is an online payment method, before confirming the order.

- Now we have to understand how the OrderStatus and PaymentStatus will be updated in each scenario.
  - If the order is created with **Cash on Delivery (COD)**:
    - OrderStatus will be set to **pending**
    - PaymentStatus will be set to **pending**
  - If the order is created with an **online payment method**:
    - OrderStatus will be set to **pending**
    - PaymentStatus will be set to **awaiting_confirmation**
  - After the order is created, the admin will confirm the order.
  - If the payment method is **COD**:
    - Admin will set OrderStatus to **confirmed**
    - PaymentStatus will remain **pending**
  - If the payment method is an **online payment method**:
    - Admin will first confirm the payment by verifying the payment receipt uploaded by the customer/admin.
    - After confirming the payment, admin will set PaymentStatus to **confirmed**
    - When the payment is confirmed, the admin will set OrderStatus to **confirmed**
  - If the customer wants to cancel the order before it is shipped (within 1 hour of order creation):
    - He will do so from mobile app side and the OrderStatus will be set to **cancelled**
    - If the payment method is an **online payment method**:
      - If the PaymentStatus is **confirmed**, admin will set PaymentStatus to **refunded** and will manually refund the amount to the customer.
      - If the payment is not received and PaymentStatus is not **confirmed** yet, admin will simply set PaymentStatus to **cancelled**.
      - If the payment is received and PaymentStatus is not **confirmed** yet, admin will first set PaymentStatus to **confirmed**, then will set it to **refunded** and will manually refund the amount to the customer.
    - If the payment method is **COD**, the PaymentStatus will automatically be set to **cancelled** when the OrderStatus is set to **cancelled**.
  - If the customer wants to change the order before it is shipped (within 1 hour of order creation):
    - The customer will update the order from mobile app side by changing products/quantities/delivery information.
    - The OrderStatus will be set to **pending** again.
    - The admin will confirm the order again as explained above.
    - **_We need to discuss the PaymentStatus flow in this case._**
  - After both the PaymentStatus and OrderStatus are set to **confirmed**, for each product in the order, the admin will provide the barcode on the admin side to update the inventory.
  - After all products' barcodes are provided, admin will select **Ship** button to set OrderStatus to **shipped**.
  - When the customer receives the products, the admin will set OrderStatus to **delivered**.
  - In case of **COD**, when the order is marked as **delivered**, PaymentStatus will be set to **confirmed** as well.
