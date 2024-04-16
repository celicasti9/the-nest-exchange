(define-fungible-token mazukamba u100000000000000000)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-amount-zero (err u101))

;; Custom function to mint tokens, only available to the contract owner
(define-public (mint (amount uint) (who principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    ;; amount, who are unchecked, but we let the contract owner mint to whoever they like for convenience
    ;; #[allow(unchecked_data)]
    (ft-mint? mazukamba amount who)
  )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) err-owner-only)
    (asserts! (> amount u0) err-amount-zero)
    ;; recipient is unchecked, anyone can transfer their tokens to anyone else
    ;; #[allow(unchecked_data)]
    (ft-transfer? mazukamba amount sender recipient)
  )
)

(define-read-only (get-balance (who principal))
  (ft-get-balance mazukamba who)
)

;; Token URI
;; --------------------------------------------------------------------------

;; Variable for URI storage
(define-data-var uri (string-utf8 256) u"https://mazukamba.com/assets/metadata.json")

;; Public getter for the URI
(define-read-only (get-token-uri)
  (ok (some (var-get uri))))


;; send many tokens to recipients
(define-public (send-many (recipients (list 200 { to: principal, amount: uint })))
  (fold check-err
    (map send-token recipients)
    (ok true)
  )
)

(define-private (send-token (recipient { to: principal, amount: uint }))
  (send-token-withouth-memo (get amount recipient) (get to recipient) )
)

(define-private (send-token-withouth-memo (amount uint) (to principal))
  (ok (try! (transfer amount tx-sender to )))
)


(define-public (burn (amount uint))
  (ft-burn? mazukamba amount tx-sender)
)


;;
(define-private (check-err (result (response bool uint)) (prior (response bool uint)))
  (match prior ok-value result
               err-value (err err-value)
  )
)

